import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { automatedAssessmentRuns, portalAuditEvents } from "../../drizzle/schema";

const countSchema = z.number().int().min(0).max(1000000000);
const findingSchema = z.object({
  tool: z.string().trim().min(1).max(40),
  type: z.enum(["vulnerability", "secret", "misconfiguration", "license", "other"]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
  ruleId: z.string().trim().max(200),
  title: z.string().trim().max(500),
  message: z.string().trim().max(1500),
  path: z.string().trim().max(1024),
  line: z.number().int().min(1).max(100000000).optional(),
  packageName: z.string().trim().max(200).optional(),
  installedVersion: z.string().trim().max(100).optional(),
  fixedVersion: z.string().trim().max(100).optional(),
  referenceUrl: z.string().url().max(2048).refine(value => { try { return new URL(value).protocol === "https:"; } catch { return false; } }, "References must use HTTPS.").optional(),
}).strict();

const reportSchema = z.object({
  summary: z.object({
    totalFindings: countSchema,
    critical: countSchema,
    high: countSchema,
    medium: countSchema,
    low: countSchema,
    unknown: countSchema,
    vulnerabilities: countSchema,
    secrets: countSchema,
    misconfigurations: countSchema,
    licenses: countSchema,
    gateStatus: z.enum(["blocked", "review", "passed"]),
    truncated: z.boolean(),
  }).strict(),
  findings: z.array(findingSchema).max(200),
}).strict().superRefine((report, ctx) => {
  const { summary, findings } = report;
  const categoryTotal = summary.vulnerabilities + summary.secrets + summary.misconfigurations + summary.licenses;
  if (summary.totalFindings !== categoryTotal) {
    ctx.addIssue({ code: "custom", path: ["summary", "totalFindings"], message: "Finding total must match category counts." });
  }
  const severityTotal = summary.critical + summary.high + summary.medium + summary.low + summary.unknown;
  if (summary.totalFindings !== severityTotal) {
    ctx.addIssue({ code: "custom", path: ["summary"], message: "Severity counts must add up to the total." });
  }
  if (findings.length > summary.totalFindings) {
    ctx.addIssue({ code: "custom", path: ["findings"], message: "Visible findings cannot exceed the summary total." });
  }
  if (!summary.truncated && findings.length !== summary.totalFindings) {
    ctx.addIssue({ code: "custom", path: ["findings"], message: "Untruncated reports must include every finding." });
  }
  const expectedGate = summary.critical + summary.high > 0 || summary.secrets > 0
    ? "blocked"
    : summary.medium + summary.low + summary.unknown > 0 || summary.misconfigurations > 0
      ? "review"
      : "passed";
  if (summary.gateStatus !== expectedGate) {
    ctx.addIssue({ code: "custom", path: ["summary", "gateStatus"], message: "Gate status is inconsistent with reported findings." });
  }
});

export const assessmentCallbackSchema = z.object({
  assessmentRunId: z.string().uuid(),
  sourceSha: z.string().regex(/^[a-f0-9]{40}$/i),
  status: z.enum(["running", "completed", "failed"]),
  workflowRunId: z.string().regex(/^\d{1,32}$/),
  workflowUrl: z.string().url().max(2048).refine(value => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "github.com" && !url.username && !url.password &&
        !url.port && !url.search && !url.hash &&
        /^\/Abhijeetjain4075\/ovanite\/actions\/runs\/\d+$/.test(url.pathname);
    } catch {
      return false;
    }
  }),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  errorCode: z.enum(["source_checkout_failed", "scan_failed", "worker_failed"]).nullable().optional(),
  report: reportSchema.optional(),
}).strict().superRefine((value, ctx) => {
  if (value.status === "completed" && !value.report) {
    ctx.addIssue({ code: "custom", path: ["report"], message: "Completed assessments require a report." });
  }
  if (value.status === "failed" && !value.errorCode) {
    ctx.addIssue({ code: "custom", path: ["errorCode"], message: "Failed assessments require a safe error code." });
  }
  if (value.status === "running" && !value.startedAt) {
    ctx.addIssue({ code: "custom", path: ["startedAt"], message: "Running assessments require a start time." });
  }
  if (value.status !== "running" && !value.finishedAt) {
    ctx.addIssue({ code: "custom", path: ["finishedAt"], message: "Terminal assessments require a finish time." });
  }
  if (value.status === "running" && (value.finishedAt || value.errorCode || value.report)) {
    ctx.addIssue({ code: "custom", path: ["status"], message: "A running callback cannot contain terminal output." });
  }
  if (value.status === "completed" && value.errorCode) {
    ctx.addIssue({ code: "custom", path: ["errorCode"], message: "A completed callback cannot contain a failure code." });
  }
  if (value.startedAt && value.finishedAt && Date.parse(value.finishedAt) < Date.parse(value.startedAt)) {
    ctx.addIssue({ code: "custom", path: ["finishedAt"], message: "Finish time cannot precede start time." });
  }
  const workflowRunIdInUrl = new URL(value.workflowUrl).pathname.match(/\\/actions\\/runs\\/(\\d+)$/)?.[1];
  if (workflowRunIdInUrl !== value.workflowRunId) {
    ctx.addIssue({ code: "custom", path: ["workflowUrl"], message: "Workflow URL and workflow run ID must match." });
  }
});

export type AssessmentCallbackTransitionDecision =
  | "update"
  | "already_running"
  | "already_terminal"
  | "workflow_mismatch"
  | "terminal_conflict"
  | "invalid_transition";

/** Decide a monotonic callback transition; the callback handler and tests share this policy. */
export function decideAssessmentCallbackTransition(
  currentStatus: string,
  currentWorkflowRunId: string | null,
  incomingStatus: "running" | "completed" | "failed",
  incomingWorkflowRunId: string,
): AssessmentCallbackTransitionDecision {
  if (currentWorkflowRunId && currentWorkflowRunId !== incomingWorkflowRunId) return "workflow_mismatch";

  if (currentStatus === "completed" || currentStatus === "failed" || currentStatus === "cancelled") {
    return currentStatus === incomingStatus && currentWorkflowRunId === incomingWorkflowRunId
      ? "already_terminal"
      : "terminal_conflict";
  }

  if (incomingStatus === "running") {
    if (currentStatus === "running" && currentWorkflowRunId === incomingWorkflowRunId) return "already_running";
    return currentStatus === "queued" || currentStatus === "dispatched" ? "update" : "invalid_transition";
  }

  return currentStatus === "running" ? "update" : "invalid_transition";
}

function hasValidBearer(req: Request, expectedSecret: string): boolean {
  const header = req.header("authorization") ?? "";
  if (!header.startsWith("Bearer ") || !expectedSecret) return false;
  const received = Buffer.from(header.slice(7));
  const expected = Buffer.from(expectedSecret);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function assessmentCallbackHandler(req: Request, res: Response): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (!ENV.assessmentCallbackSecret) {
    res.status(503).json({ error: "Assessment callback is not configured." });
    return;
  }
  if (!hasValidBearer(req, ENV.assessmentCallbackSecret)) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const parsed = assessmentCallbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid assessment callback payload." });
    return;
  }
  const callback = parsed.data;
  if (callback.report && Buffer.byteLength(JSON.stringify(callback.report), "utf8") > 450000) {
    res.status(413).json({ error: "Assessment report exceeds the allowed size." });
    return;
  }

  const db = await getDb();
  if (!db) {
    res.status(503).json({ error: "Assessment database is unavailable." });
    return;
  }

  try {
    const result = await db.transaction(async tx => {
      const [run] = await tx.select().from(automatedAssessmentRuns)
        .where(eq(automatedAssessmentRuns.id, callback.assessmentRunId))
        .limit(1).for("update");
      if (!run) return "not_found" as const;
      if (run.sourceSha.toLowerCase() !== callback.sourceSha.toLowerCase()) return "revision_mismatch" as const;
      const transition = decideAssessmentCallbackTransition(
        run.status, run.workflowRunId, callback.status, callback.workflowRunId,
      );
      if (transition !== "update") return transition;

      const now = new Date();
      const startedAt = callback.startedAt ? new Date(callback.startedAt) : now;
      const finishedAt = callback.finishedAt ? new Date(callback.finishedAt) : (callback.status === "running" ? null : now);
      await tx.update(automatedAssessmentRuns).set({
        status: callback.status,
        workflowRunId: callback.workflowRunId,
        workflowUrl: callback.workflowUrl,
        startedAt: run.startedAt ?? startedAt,
        finishedAt,
        report: callback.report ?? run.report,
        errorCode: callback.status === "failed" ? callback.errorCode ?? "worker_failed" : null,
        updatedAt: now,
      }).where(and(
        eq(automatedAssessmentRuns.id, callback.assessmentRunId),
        eq(automatedAssessmentRuns.sourceSha, run.sourceSha),
      ));

      await tx.insert(portalAuditEvents).values({
        submissionId: run.submissionId,
        actorId: null,
        actorRole: "automation",
        eventType: `automated_assessment_${callback.status}`,
        fromStatus: null,
        toStatus: null,
        details: {
          assessmentRunId: run.id,
          sourceSha: run.sourceSha,
          workflowRunId: callback.workflowRunId,
          errorCode: callback.errorCode ?? null,
          gateStatus: callback.report?.summary.gateStatus ?? null,
          totalFindings: callback.report?.summary.totalFindings ?? null,
        },
      });
      return "updated" as const;
    });

    if (result === "not_found") {
      res.status(404).json({ error: "Assessment run not found." });
      return;
    }
    if (result === "revision_mismatch") {
      res.status(409).json({ error: "Assessment revision does not match the queued commit." });
      return;
    }
    if (result === "terminal_conflict" || result === "workflow_mismatch" || result === "invalid_transition") {
      res.status(409).json({ error: "Assessment callback conflicts with the stored run state." });
      return;
    }
    // Duplicate running or terminal callbacks from the same workflow are safe no-ops.
    res.status(204).end();
  } catch {
    // Avoid leaking database details, report contents, or submitted project information.
    res.status(500).json({ error: "Assessment callback could not be recorded." });
  }
}
