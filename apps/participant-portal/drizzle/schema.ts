import {
  index,
  int,
  json,
  longtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Application users backing the existing Manus OAuth/session flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  portalRole: mysqlEnum("portalRole", ["participant", "owner", "editor", "viewer"])
    .default("participant")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const termsVersions = mysqlTable("terms_versions", {
  version: varchar("version", { length: 64 }).primaryKey(),
  status: mysqlEnum("status", ["draft", "published", "retired"]).default("draft").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: longtext("content").notNull(),
  declarations: json("declarations").$type<string[]>().notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  publishedBy: int("publishedBy").references(() => users.id),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("terms_status_idx").on(table.status)]);

export const submissions = mysqlTable(
  "submissions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    participantId: int("participantId").notNull().references(() => users.id),
    participantName: varchar("participantName", { length: 180 }),
    participantEmail: varchar("participantEmail", { length: 320 }),
    country: varchar("country", { length: 120 }),
    profileUrl: varchar("profileUrl", { length: 2048 }),
    projectName: varchar("projectName", { length: 180 }),
    shortDescription: varchar("shortDescription", { length: 500 }),
    problemSolved: text("problemSolved"),
    category: varchar("category", { length: 100 }),
    repositoryUrl: varchar("repositoryUrl", { length: 2048 }),
    repositoryKey: varchar("repositoryKey", { length: 512 }),
    liveUrl: varchar("liveUrl", { length: 2048 }),
    documentationUrl: varchar("documentationUrl", { length: 2048 }),
    demoVideoUrl: varchar("demoVideoUrl", { length: 2048 }),
    technologyStack: text("technologyStack"),
    projectStatus: varchar("projectStatus", { length: 60 }),
    draftData: json("draftData").$type<Record<string, string> | null>(),
    declarations: json("declarations").$type<Record<string, boolean> | null>(),
    termsVersion: varchar("termsVersion", { length: 64 }).references(() => termsVersions.version),
    termsAcceptedAt: timestamp("termsAcceptedAt"),
    status: mysqlEnum("status", [
      "draft",
      "submitted",
      "terms_accepted",
      "validation",
      "evaluation",
      "eligible",
      "not_eligible",
      "selected",
      "rejected",
      "withdrawn",
      "archived",
    ]).default("draft").notNull(),
    submittedAt: timestamp("submittedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("submissions_participant_idx").on(table.participantId, table.status),
    index("submissions_status_created_idx").on(table.status, table.createdAt),
    index("submissions_category_idx").on(table.category),
    uniqueIndex("submissions_repository_key_uq").on(table.repositoryKey),
  ],
);

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

export const rubricVersions = mysqlTable("rubric_versions", {
  version: varchar("version", { length: 64 }).primaryKey(),
  status: mysqlEnum("status", ["draft", "published", "retired"]).default("draft").notNull(),
  criteria: json("criteria").$type<Array<{ id: string; label: string; description: string; weight: number }>>().notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  publishedBy: int("publishedBy").references(() => users.id),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("rubric_status_idx").on(table.status)]);

export const validationResults = mysqlTable(
  "validation_results",
  {
    id: int("id").autoincrement().primaryKey(),
    submissionId: varchar("submissionId", { length: 36 }).notNull().references(() => submissions.id),
    outcome: mysqlEnum("outcome", ["pass", "fail"]).notNull(),
    checks: json("checks").$type<Record<string, boolean>>().notNull(),
    notes: text("notes"),
    validatorId: int("validatorId").notNull().references(() => users.id),
    validatorRole: varchar("validatorRole", { length: 32 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("validation_submission_idx").on(table.submissionId, table.createdAt)],
);

export const evaluations = mysqlTable(
  "evaluations",
  {
    id: int("id").autoincrement().primaryKey(),
    submissionId: varchar("submissionId", { length: 36 }).notNull().references(() => submissions.id),
    evaluatorId: int("evaluatorId").notNull().references(() => users.id),
    evaluatorRole: varchar("evaluatorRole", { length: 32 }).notNull(),
    rubricVersion: varchar("rubricVersion", { length: 64 }).notNull().references(() => rubricVersions.version),
    scores: json("scores").$type<Record<string, number>>().notNull(),
    criterionNotes: json("criterionNotes").$type<Record<string, string>>().notNull(),
    notes: text("notes"),
    overallScore: int("overallScore").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("evaluation_submission_idx").on(table.submissionId, table.createdAt)],
);

export const decisions = mysqlTable(
  "decisions",
  {
    id: int("id").autoincrement().primaryKey(),
    submissionId: varchar("submissionId", { length: 36 }).notNull().references(() => submissions.id),
    decision: mysqlEnum("decision", ["eligible", "not_eligible", "selected", "rejected"]).notNull(),
    note: text("note"),
    decidedBy: int("decidedBy").notNull().references(() => users.id),
    decidedByRole: varchar("decidedByRole", { length: 32 }).notNull(),
    decidedAt: timestamp("decidedAt").defaultNow().notNull(),
  },
  table => [index("decision_submission_idx").on(table.submissionId, table.decidedAt)],
);

export const withdrawals = mysqlTable("withdrawals", {
  submissionId: varchar("submissionId", { length: 36 }).primaryKey().references(() => submissions.id),
  participantId: int("participantId").notNull().references(() => users.id),
  reason: varchar("reason", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Append-only record of lifecycle, review, terms, and configuration actions. */
export const portalAuditEvents = mysqlTable(
  "portal_audit_events",
  {
    id: int("id").autoincrement().primaryKey(),
    submissionId: varchar("submissionId", { length: 36 }).references(() => submissions.id),
    actorId: int("actorId").references(() => users.id),
    actorRole: varchar("actorRole", { length: 32 }).notNull(),
    eventType: varchar("eventType", { length: 80 }).notNull(),
    fromStatus: varchar("fromStatus", { length: 32 }),
    toStatus: varchar("toStatus", { length: 32 }),
    details: json("details").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("audit_submission_idx").on(table.submissionId, table.createdAt),
    index("audit_actor_idx").on(table.actorId, table.createdAt),
  ],
);
