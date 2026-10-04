import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gte, like, lte, ne, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  decisions,
  evaluations,
  portalAuditEvents,
  rubricVersions,
  submissions,
  termsVersions,
  users,
  validationResults,
  withdrawals,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { ownerProcedure, protectedProcedure, reviewerProcedure, router, staffProcedure } from "../_core/trpc";
import { ACTIVE_PARTICIPANT_WITHDRAWAL_STATES, canTransition, type SubmissionStatus } from "./lifecycle";
import { DEFAULT_RUBRIC } from "./defaults";
import { declarationsSchema, draftDataSchema, REQUIRED_DECLARATIONS, submissionDataSchema, urlFilterSchema, VALIDATION_CHECK_IDS } from "./validation";

const submissionIdSchema = z.string().uuid();
const versionSchema = z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);
const criteriaSchema = z.array(z.object({
  id: z.string().trim().min(2).max(64).regex(/^[a-z0-9-]+$/),
  label: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(500),
  weight: z.number().int().min(1).max(100),
})).min(1).max(20).refine(items => new Set(items.map(item => item.id)).size === items.length, "Criterion IDs must be unique.").refine(items => items.reduce((total, item) => total + item.weight, 0) === 100, "Rubric weights must total 100%.");
const staffFilterSchema = urlFilterSchema.safeExtend({
  status: z.enum(["draft", "submitted", "terms_accepted", "validation", "evaluation", "eligible", "not_eligible", "selected", "rejected", "withdrawn", "archived"]).optional(),
});

function requireDatabase() {
  return getDb().then(db => {
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The portal database is unavailable." });
    return db;
  });
}

function normalizeRepositoryKey(value: string): string {
  if (!value) return "";
  const url = new URL(value);
  const path = url.pathname.replace(/\.git$/i, "").replace(/\/+$/, "");
  return `${url.hostname}${path}`.toLowerCase();
}

function auditValues(input: {
  submissionId?: string | null;
  actorId?: number | null;
  actorRole: string;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  details?: Record<string, unknown> | null;
}) {
  return {
    submissionId: input.submissionId ?? null,
    actorId: input.actorId ?? null,
    actorRole: input.actorRole,
    eventType: input.eventType,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    details: input.details ?? null,
  };
}

async function latestPublishedTerms() {
  const db = await requireDatabase();
  const [terms] = await db.select().from(termsVersions)
    .where(eq(termsVersions.status, "published"))
    .orderBy(desc(termsVersions.publishedAt)).limit(1);
  return terms ?? null;
}

async function latestPublishedRubric() {
  const db = await requireDatabase();
  const [rubric] = await db.select().from(rubricVersions)
    .where(eq(rubricVersions.status, "published"))
    .orderBy(desc(rubricVersions.publishedAt)).limit(1);
  return rubric ?? null;
}

export const portalRouter = router({
  currentTerms: router({
    get: protectedProcedure.query(async () => latestPublishedTerms()),
  }),

  mySubmissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDatabase();
    return db.select({
      id: submissions.id,
      projectName: submissions.projectName,
      category: submissions.category,
      status: submissions.status,
      termsVersion: submissions.termsVersion,
      submittedAt: submissions.submittedAt,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
    }).from(submissions)
      .where(eq(submissions.participantId, ctx.user.id))
      .orderBy(desc(submissions.updatedAt));
  }),

  latestDraft: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDatabase();
    const [draft] = await db.select().from(submissions)
      .where(and(eq(submissions.participantId, ctx.user.id), eq(submissions.status, "draft")))
      .orderBy(desc(submissions.updatedAt)).limit(1);
    return draft ? { id: draft.id, data: draft.draftData ?? {} } : null;
  }),

  saveDraft: protectedProcedure.input(z.object({ id: submissionIdSchema.optional(), data: draftDataSchema })).mutation(async ({ ctx, input }) => {
    const db = await requireDatabase();
    const id = input.id ?? randomUUID();
    if (input.id) {
      const [existing] = await db.select({ id: submissions.id, status: submissions.status }).from(submissions)
        .where(and(eq(submissions.id, id), eq(submissions.participantId, ctx.user.id))).limit(1);
      if (!existing || existing.status !== "draft") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found or no longer editable." });
      }
      await db.update(submissions).set({ draftData: input.data, updatedAt: new Date() })
        .where(and(eq(submissions.id, id), eq(submissions.participantId, ctx.user.id), eq(submissions.status, "draft")));
      await db.insert(portalAuditEvents).values(auditValues({
        submissionId: id, actorId: ctx.user.id, actorRole: "participant", eventType: "draft_saved",
      }));
    } else {
      await db.transaction(async tx => {
        await tx.insert(submissions).values({ id, participantId: ctx.user.id, status: "draft", draftData: input.data });
        await tx.insert(portalAuditEvents).values(auditValues({
          submissionId: id, actorId: ctx.user.id, actorRole: "participant", eventType: "draft_created",
        }));
      });
    }
    return { id, savedAt: new Date() };
  }),

  submit: protectedProcedure.input(z.object({
    id: submissionIdSchema,
    termsVersion: versionSchema,
    data: submissionDataSchema,
    declarations: declarationsSchema,
  })).mutation(async ({ ctx, input }) => {
    const db = await requireDatabase();
    const repositoryKey = normalizeRepositoryKey(input.data.repositoryUrl);
    const acceptedAt = new Date();
    try {
      await db.transaction(async tx => {
        const [currentTerms] = await tx.select().from(termsVersions)
          .where(eq(termsVersions.status, "published")).orderBy(desc(termsVersions.publishedAt)).limit(1).for("update");
        if (!currentTerms || currentTerms.version !== input.termsVersion) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Program terms have changed. Review the current version before submitting." });
        }
        const [existing] = await tx.select().from(submissions)
          .where(and(eq(submissions.id, input.id), eq(submissions.participantId, ctx.user.id)))
          .limit(1).for("update");
        if (!existing || existing.status !== "draft") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found or already submitted." });
        }
        if (repositoryKey) {
          const [submittedDuplicate] = await tx.select({ id: submissions.id }).from(submissions)
            .where(eq(submissions.repositoryKey, repositoryKey)).limit(1);
          if (submittedDuplicate && submittedDuplicate.id !== input.id) {
            throw new TRPCError({ code: "CONFLICT", message: "A submission already uses this repository. Review your project link or contact Ovanite program support." });
          }
        }
        await tx.update(submissions).set({
          ...input.data,
          repositoryKey: repositoryKey || null,
          draftData: null,
          declarations: input.declarations,
          termsVersion: currentTerms.version,
          termsAcceptedAt: acceptedAt,
          submittedAt: acceptedAt,
          status: "submitted",
          updatedAt: acceptedAt,
        }).where(and(eq(submissions.id, input.id), eq(submissions.participantId, ctx.user.id), eq(submissions.status, "draft")));
        await tx.insert(portalAuditEvents).values(auditValues({
          submissionId: input.id, actorId: ctx.user.id, actorRole: "participant", eventType: "submission_received",
          fromStatus: "draft", toStatus: "submitted", details: { termsVersion: currentTerms.version },
        }));
        await tx.update(submissions).set({ status: "terms_accepted", updatedAt: acceptedAt })
          .where(and(eq(submissions.id, input.id), eq(submissions.participantId, ctx.user.id), eq(submissions.status, "submitted")));
        await tx.insert(portalAuditEvents).values(auditValues({
          submissionId: input.id, actorId: ctx.user.id, actorRole: "participant", eventType: "terms_accepted",
          fromStatus: "submitted", toStatus: "terms_accepted",
          details: { termsVersion: currentTerms.version, acceptedAt: acceptedAt.toISOString() },
        }));
      });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ER_DUP_ENTRY") {
        throw new TRPCError({ code: "CONFLICT", message: "A submission already uses this repository. Review your project link or contact Ovanite program support." });
      }
      throw error;
    }
    return { id: input.id, status: "terms_accepted" as const, submittedAt: acceptedAt, termsVersion: input.termsVersion };
  }),

  updateSubmitted: protectedProcedure.input(z.object({ id: submissionIdSchema, data: submissionDataSchema })).mutation(async ({ ctx, input }) => {
    const db = await requireDatabase();
    const repositoryKey = normalizeRepositoryKey(input.data.repositoryUrl);
    await db.transaction(async tx => {
      const [existing] = await tx.select().from(submissions)
        .where(and(eq(submissions.id, input.id), eq(submissions.participantId, ctx.user.id)))
        .limit(1).for("update");
      if (!existing || existing.status !== "terms_accepted") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Project details can only be updated before validation begins." });
      }
      if (repositoryKey) {
        const [duplicate] = await tx.select({ id: submissions.id }).from(submissions)
          .where(eq(submissions.repositoryKey, repositoryKey)).limit(1);
        if (duplicate && duplicate.id !== input.id) {
          throw new TRPCError({ code: "CONFLICT", message: "A submission already uses this repository. Review your project link or contact Ovanite program support." });
        }
      }
      await tx.update(submissions).set({
        ...input.data, repositoryKey: repositoryKey || null, updatedAt: new Date(),
      }).where(and(eq(submissions.id, input.id), eq(submissions.participantId, ctx.user.id), eq(submissions.status, "terms_accepted")));
      await tx.insert(portalAuditEvents).values(auditValues({
        submissionId: input.id, actorId: ctx.user.id, actorRole: "participant", eventType: "participant_update",
        details: { scope: "project_details" },
      }));
    });
    return { updated: true };
  }),

  detailMine: protectedProcedure.input(z.object({ id: submissionIdSchema })).query(async ({ ctx, input }) => {
    const db = await requireDatabase();
    const [record] = await db.select().from(submissions)
      .where(and(eq(submissions.id, input.id), eq(submissions.participantId, ctx.user.id))).limit(1);
    if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
    const history = await db.select({ eventType: portalAuditEvents.eventType, fromStatus: portalAuditEvents.fromStatus, toStatus: portalAuditEvents.toStatus, createdAt: portalAuditEvents.createdAt })
      .from(portalAuditEvents).where(eq(portalAuditEvents.submissionId, record.id)).orderBy(desc(portalAuditEvents.createdAt));
    const [validation] = await db.select({ outcome: validationResults.outcome, createdAt: validationResults.createdAt })
      .from(validationResults).where(eq(validationResults.submissionId, record.id)).orderBy(desc(validationResults.createdAt)).limit(1);
    const [evaluation] = await db.select({ id: evaluations.id, overallScore: evaluations.overallScore, createdAt: evaluations.createdAt })
      .from(evaluations).where(eq(evaluations.submissionId, record.id)).orderBy(desc(evaluations.createdAt)).limit(1);
    const acceptedTerms = record.termsVersion
      ? (await db.select({ version: termsVersions.version, title: termsVersions.title, content: termsVersions.content, declarations: termsVersions.declarations, publishedAt: termsVersions.publishedAt })
          .from(termsVersions).where(eq(termsVersions.version, record.termsVersion)).limit(1))[0] ?? null
      : null;
    return {
      record,
      acceptedTerms,
      history,
      validation: validation ?? null,
      evaluation: evaluation ? { submittedAt: evaluation.createdAt, available: record.status === "selected" || record.status === "rejected" || record.status === "archived" } : null,
    };
  }),

  withdraw: protectedProcedure.input(z.object({ id: submissionIdSchema, reason: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDatabase();
    await db.transaction(async tx => {
      const [record] = await tx.select().from(submissions)
        .where(and(eq(submissions.id, input.id), eq(submissions.participantId, ctx.user.id)))
        .limit(1).for("update");
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
      if (!ACTIVE_PARTICIPANT_WITHDRAWAL_STATES.includes(record.status)) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This submission cannot be withdrawn in its current status." });
      }
      await tx.update(submissions).set({ status: "withdrawn", updatedAt: new Date() })
        .where(and(eq(submissions.id, input.id), eq(submissions.participantId, ctx.user.id), eq(submissions.status, record.status)));
      await tx.insert(withdrawals).values({ submissionId: input.id, participantId: ctx.user.id, reason: input.reason || null });
      await tx.insert(portalAuditEvents).values(auditValues({
        submissionId: input.id, actorId: ctx.user.id, actorRole: "participant", eventType: "participant_withdrawal",
        fromStatus: record.status, toStatus: "withdrawn", details: { reasonProvided: Boolean(input.reason) },
      }));
    });
    return { status: "withdrawn" as const };
  }),

  admin: router({
    queue: staffProcedure.input(staffFilterSchema).query(async ({ input }) => {
      const db = await requireDatabase();
      const filters = [ne(submissions.status, "draft")];
      if (input.status) filters.push(eq(submissions.status, input.status));
      if (input.category) filters.push(eq(submissions.category, input.category));
      if (input.from) filters.push(gte(submissions.submittedAt, new Date(`${input.from}T00:00:00.000Z`)));
      if (input.to) filters.push(lte(submissions.submittedAt, new Date(`${input.to}T23:59:59.999Z`)));
      if (input.q) {
        const escaped = input.q.replace(/[\\%_]/g, "\\$&");
        const term = `%${escaped}%`;
        filters.push(or(like(submissions.projectName, term), like(submissions.participantName, term), like(submissions.participantEmail, term))!);
      }
      const whereClause = filters.length ? and(...filters) : undefined;
      const [total] = await db.select({ value: count() }).from(submissions).where(whereClause);
      const rows = await db.select({ submission: submissions })
        .from(submissions).where(whereClause)
        .orderBy(desc(submissions.submittedAt)).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
      const categories = await db.selectDistinct({ category: submissions.category }).from(submissions).where(ne(submissions.status, "draft"));
      return { items: rows.map(row => row.submission), total: Number(total?.value ?? 0), page: input.page, pageSize: input.pageSize, categories: categories.map(row => row.category).filter((value): value is string => Boolean(value)) };
    }),

    detail: staffProcedure.input(z.object({ id: submissionIdSchema })).query(async ({ input }) => {
      const db = await requireDatabase();
      const [record] = await db.select({ submission: submissions, userName: users.name, userEmail: users.email })
        .from(submissions).leftJoin(users, eq(submissions.participantId, users.id))
        .where(eq(submissions.id, input.id)).limit(1);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
      const [acceptedTerms] = record.submission.termsVersion
        ? await db.select().from(termsVersions).where(eq(termsVersions.version, record.submission.termsVersion)).limit(1)
        : [null];
      const validations = await db.select({ result: validationResults, evaluatorName: users.name, evaluatorRole: validationResults.validatorRole })
        .from(validationResults).leftJoin(users, eq(validationResults.validatorId, users.id))
        .where(eq(validationResults.submissionId, input.id)).orderBy(desc(validationResults.createdAt));
      const evaluationRows = await db.select({ result: evaluations, evaluatorName: users.name, evaluatorRole: evaluations.evaluatorRole })
        .from(evaluations).leftJoin(users, eq(evaluations.evaluatorId, users.id))
        .where(eq(evaluations.submissionId, input.id)).orderBy(desc(evaluations.createdAt));
      const decisionRows = await db.select({ result: decisions, decisionMakerName: users.name, decisionMakerRole: decisions.decidedByRole })
        .from(decisions).leftJoin(users, eq(decisions.decidedBy, users.id))
        .where(eq(decisions.submissionId, input.id)).orderBy(desc(decisions.decidedAt));
      const events = await db.select({ event: portalAuditEvents, actorName: users.name })
        .from(portalAuditEvents).leftJoin(users, eq(portalAuditEvents.actorId, users.id))
        .where(eq(portalAuditEvents.submissionId, input.id)).orderBy(desc(portalAuditEvents.createdAt));
      return { ...record, acceptedTerms: acceptedTerms ?? null, validations, evaluations: evaluationRows, decisions: decisionRows, events };
    }),

    evaluationQueue: staffProcedure.query(async () => {
      const db = await requireDatabase();
      const rows = await db.select({ submission: submissions })
        .from(submissions).where(eq(submissions.status, "evaluation"))
        .orderBy(desc(submissions.updatedAt)).limit(100);
      const rubric = await latestPublishedRubric();
      return { items: rows.map(row => row.submission), rubric };
    }),

    saveValidation: reviewerProcedure.input(z.object({
      id: submissionIdSchema,
      checks: z.record(z.string(), z.boolean()).refine(value =>
        Object.keys(value).length === VALIDATION_CHECK_IDS.length && VALIDATION_CHECK_IDS.every(id => Object.hasOwn(value, id)),
      "Record each required validation check."),
      notes: z.string().trim().max(5000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await requireDatabase();
      const outcome = await db.transaction(async tx => {
        const [record] = await tx.select().from(submissions)
          .where(eq(submissions.id, input.id)).limit(1).for("update");
        if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
        if (record.status !== "validation") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Validation results can only be recorded during validation." });
        const result = Object.values(input.checks).every(Boolean) ? "pass" : "fail";
        await tx.insert(validationResults).values({ submissionId: input.id, outcome, checks: input.checks, notes: input.notes || null, validatorId: ctx.user.id, validatorRole: ctx.portalRole });
        await tx.insert(portalAuditEvents).values(auditValues({
          submissionId: input.id, actorId: ctx.user.id, actorRole: ctx.portalRole, eventType: "validation_recorded",
          details: { outcome: result, checkCount: Object.keys(input.checks).length },
        }));
        return result;
      });
      return { outcome };
    }),

    advance: reviewerProcedure.input(z.object({
      id: submissionIdSchema,
      to: z.enum(["validation", "evaluation", "eligible", "not_eligible", "selected", "rejected", "archived"]),
      note: z.string().trim().max(5000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await requireDatabase();
      await db.transaction(async tx => {
        const [record] = await tx.select().from(submissions).where(eq(submissions.id, input.id)).limit(1).for("update");
        if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
        if (!canTransition(record.status as SubmissionStatus, input.to)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Cannot move a submission from ${record.status} to ${input.to}.` });
        }
        if (input.to === "archived" && ctx.portalRole !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can archive a record." });
        }
        if (input.to === "evaluation") {
          const [validation] = await tx.select().from(validationResults).where(eq(validationResults.submissionId, input.id)).orderBy(desc(validationResults.createdAt)).limit(1);
          if (!validation || validation.outcome !== "pass") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A passing validation record is required before evaluation." });
        }
        if (["eligible", "not_eligible", "selected", "rejected"].includes(input.to)) {
          const [evaluation] = await tx.select({ id: evaluations.id }).from(evaluations).where(eq(evaluations.submissionId, input.id)).orderBy(desc(evaluations.createdAt)).limit(1);
          if (!evaluation) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A submitted rubric evaluation is required before a decision." });
        }
        await tx.update(submissions).set({ status: input.to, updatedAt: new Date() })
          .where(and(eq(submissions.id, input.id), eq(submissions.status, record.status)));
        if (["eligible", "not_eligible", "selected", "rejected"].includes(input.to)) {
          await tx.insert(decisions).values({ submissionId: input.id, decision: input.to as "eligible" | "not_eligible" | "selected" | "rejected", note: input.note || null, decidedBy: ctx.user.id, decidedByRole: ctx.portalRole });
        }
        await tx.insert(portalAuditEvents).values(auditValues({
          submissionId: input.id, actorId: ctx.user.id, actorRole: ctx.portalRole, eventType: input.to === "archived" ? "submission_archived" : "status_changed",
          fromStatus: record.status, toStatus: input.to, details: input.note ? { note: input.note } : null,
        }));
      });
      return { status: input.to };
    }),

    saveEvaluation: reviewerProcedure.input(z.object({
      id: submissionIdSchema,
      scores: z.record(z.string(), z.number().int().min(0).max(5)),
      criterionNotes: z.record(z.string(), z.string().trim().max(2000)),
      notes: z.string().trim().max(5000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await requireDatabase();
      const result = await db.transaction(async tx => {
        const [record] = await tx.select().from(submissions)
          .where(eq(submissions.id, input.id)).limit(1).for("update");
        if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
        if (record.status !== "evaluation") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Rubric scoring is only available while the submission is in evaluation." });
        const [rubric] = await tx.select().from(rubricVersions)
          .where(eq(rubricVersions.status, "published")).orderBy(desc(rubricVersions.publishedAt)).limit(1).for("update");
        if (!rubric) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "An owner must publish a rubric before scoring." });
        const expected = rubric.criteria.map(criterion => criterion.id).sort();
        if (JSON.stringify(Object.keys(input.scores).sort()) !== JSON.stringify(expected)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Score every criterion in the current published rubric." });
        }
        const weightedScore = Math.round(rubric.criteria.reduce((total, criterion) => total + input.scores[criterion.id] * criterion.weight, 0) / 100);
        await tx.insert(evaluations).values({
          submissionId: input.id, evaluatorId: ctx.user.id, evaluatorRole: ctx.portalRole, rubricVersion: rubric.version,
          scores: input.scores, criterionNotes: input.criterionNotes, notes: input.notes || null, overallScore: weightedScore,
        });
        await tx.insert(portalAuditEvents).values(auditValues({
          submissionId: input.id, actorId: ctx.user.id, actorRole: ctx.portalRole,
          eventType: "evaluation_submitted", details: { rubricVersion: rubric.version, overallScore: weightedScore },
        }));
        return { overallScore: weightedScore, rubricVersion: rubric.version };
      });
      return result;
    }),

    termsVersions: staffProcedure.query(async () => {
      const db = await requireDatabase();
      return db.select().from(termsVersions).orderBy(desc(termsVersions.createdAt));
    }),

    createTermsDraft: ownerProcedure.input(z.object({
      version: versionSchema,
      title: z.string().trim().min(2).max(200),
      content: z.string().trim().min(10).max(50000),
    })).mutation(async ({ ctx, input }) => {
      const db = await requireDatabase();
      const [existing] = await db.select({ version: termsVersions.version }).from(termsVersions).where(eq(termsVersions.version, input.version)).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "That terms version already exists. Create a new version identifier." });
      await db.transaction(async tx => {
        await tx.insert(termsVersions).values({
          version: input.version, title: input.title, content: input.content,
          declarations: REQUIRED_DECLARATIONS.map(declaration => declaration.label), createdBy: ctx.user.id,
        });
        await tx.insert(portalAuditEvents).values(auditValues({ actorId: ctx.user.id, actorRole: ctx.portalRole, eventType: "terms_draft_created", details: { version: input.version } }));
      });
      return { version: input.version, status: "draft" as const };
    }),

    updateTermsDraft: ownerProcedure.input(z.object({
      version: versionSchema,
      title: z.string().trim().min(2).max(200),
      content: z.string().trim().min(10).max(50000),
    })).mutation(async ({ ctx, input }) => {
      const db = await requireDatabase();
      await db.transaction(async tx => {
        const [draft] = await tx.select().from(termsVersions).where(eq(termsVersions.version, input.version)).limit(1).for("update");
        if (!draft || draft.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Published or retired terms versions are immutable. Create a new draft." });
        await tx.update(termsVersions).set({ title: input.title, content: input.content, updatedAt: new Date() })
          .where(and(eq(termsVersions.version, input.version), eq(termsVersions.status, "draft")));
        await tx.insert(portalAuditEvents).values(auditValues({ actorId: ctx.user.id, actorRole: ctx.portalRole, eventType: "terms_draft_updated", details: { version: input.version } }));
      });
      return { version: input.version, status: "draft" as const };
    }),

    publishTerms: ownerProcedure.input(z.object({ version: versionSchema })).mutation(async ({ ctx, input }) => {
      const db = await requireDatabase();
      await db.transaction(async tx => {
        const [draft] = await tx.select().from(termsVersions).where(eq(termsVersions.version, input.version)).limit(1).for("update");
        if (!draft || draft.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only a draft terms version can be published." });
        await tx.update(termsVersions).set({ status: "retired", updatedAt: new Date() }).where(eq(termsVersions.status, "published"));
        await tx.update(termsVersions).set({ status: "published", publishedBy: ctx.user.id, publishedAt: new Date(), updatedAt: new Date() }).where(eq(termsVersions.version, input.version));
        await tx.insert(portalAuditEvents).values(auditValues({ actorId: ctx.user.id, actorRole: ctx.portalRole, eventType: "terms_version_published", details: { version: input.version } }));
      });
      return { version: input.version, status: "published" as const };
    }),

    rubricVersions: staffProcedure.query(async () => {
      const db = await requireDatabase();
      const versions = await db.select().from(rubricVersions).orderBy(desc(rubricVersions.createdAt));
      return { versions, defaultCriteria: DEFAULT_RUBRIC };
    }),

    createRubricDraft: ownerProcedure.input(z.object({ version: versionSchema, criteria: criteriaSchema })).mutation(async ({ ctx, input }) => {
      const db = await requireDatabase();
      const [existing] = await db.select({ version: rubricVersions.version }).from(rubricVersions).where(eq(rubricVersions.version, input.version)).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "That rubric version already exists." });
      await db.transaction(async tx => {
        await tx.insert(rubricVersions).values({ version: input.version, criteria: input.criteria, createdBy: ctx.user.id });
        await tx.insert(portalAuditEvents).values(auditValues({ actorId: ctx.user.id, actorRole: ctx.portalRole, eventType: "rubric_draft_created", details: { version: input.version } }));
      });
      return { version: input.version, status: "draft" as const };
    }),

    updateRubricDraft: ownerProcedure.input(z.object({ version: versionSchema, criteria: criteriaSchema })).mutation(async ({ ctx, input }) => {
      const db = await requireDatabase();
      await db.transaction(async tx => {
        const [draft] = await tx.select().from(rubricVersions).where(eq(rubricVersions.version, input.version)).limit(1).for("update");
        if (!draft || draft.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Published or retired rubrics are immutable. Create a new draft." });
        await tx.update(rubricVersions).set({ criteria: input.criteria, updatedAt: new Date() })
          .where(and(eq(rubricVersions.version, input.version), eq(rubricVersions.status, "draft")));
        await tx.insert(portalAuditEvents).values(auditValues({ actorId: ctx.user.id, actorRole: ctx.portalRole, eventType: "rubric_draft_updated", details: { version: input.version } }));
      });
      return { version: input.version, status: "draft" as const };
    }),

    publishRubric: ownerProcedure.input(z.object({ version: versionSchema })).mutation(async ({ ctx, input }) => {
      const db = await requireDatabase();
      await db.transaction(async tx => {
        const [draft] = await tx.select().from(rubricVersions).where(eq(rubricVersions.version, input.version)).limit(1).for("update");
        if (!draft || draft.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only a draft rubric version can be published." });
        await tx.update(rubricVersions).set({ status: "retired", updatedAt: new Date() }).where(eq(rubricVersions.status, "published"));
        await tx.update(rubricVersions).set({ status: "published", publishedBy: ctx.user.id, publishedAt: new Date(), updatedAt: new Date() }).where(eq(rubricVersions.version, input.version));
        await tx.insert(portalAuditEvents).values(auditValues({ actorId: ctx.user.id, actorRole: ctx.portalRole, eventType: "rubric_version_published", details: { version: input.version } }));
      });
      return { version: input.version, status: "published" as const };
    }),
  }),
});
