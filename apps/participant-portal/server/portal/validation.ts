import { z } from "zod";

export const REQUIRED_DECLARATIONS = [
  { id: "rights", label: "I own or have the rights needed to submit this software and its materials." },
  { id: "thirdParty", label: "I know of no third-party rights violation in the materials I am submitting." },
  { id: "noGuarantee", label: "I understand this submission does not itself guarantee selection, funding, employment, partnership, publication, or any other outcome." },
  { id: "evaluation", label: "I authorize Ovanite to evaluate this submission under the published program rules." },
  { id: "terms", label: "I have read and accept the current Ovanite program terms." },
] as const;

export const VALIDATION_CHECK_IDS = [
  "evidence_links_reviewed",
  "problem_scope_reviewed",
  "rights_declaration_reviewed",
  "duplicate_check_completed",
  "terms_version_current",
] as const;

export type SubmissionCategory =
  | "Developer tools"
  | "Education"
  | "Climate & energy"
  | "Health & care"
  | "Finance & commerce"
  | "Public interest"
  | "Creative tools"
  | "Other";

const text = (max: number) => z.string().trim().max(max);
const draftField = text(10000).optional().default("");

export const draftDataSchema = z.object({
  participantName: text(180).optional().default(""),
  participantEmail: z.string().trim().max(320).optional().default(""),
  country: text(120).optional().default(""),
  profileUrl: text(2048).optional().default(""),
  projectName: text(180).optional().default(""),
  shortDescription: text(500).optional().default(""),
  problemSolved: draftField,
  category: text(100).optional().default(""),
  repositoryUrl: text(2048).optional().default(""),
  liveUrl: text(2048).optional().default(""),
  documentationUrl: text(2048).optional().default(""),
  demoVideoUrl: text(2048).optional().default(""),
  technologyStack: text(2000).optional().default(""),
  projectStatus: text(60).optional().default(""),
});

export type SubmissionFormData = z.infer<typeof draftDataSchema>;

function safeWebUrl(required = false) {
  const schema = z.string().trim().max(2048);
  const valueSchema = required ? schema.min(1, "Enter a URL.") : schema.optional().default("");
  return valueSchema.superRefine((value: string, ctx) => {
    if (!value) return;
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
        ctx.addIssue({ code: "custom", message: "Use a public http or https URL without embedded credentials." });
      }
    } catch {
      ctx.addIssue({ code: "custom", message: "Enter a complete URL beginning with https:// or http://." });
    }
  }).transform((value: string) => normalizeWebUrl(value));
}

export function normalizeWebUrl(value: string): string {
  if (!value) return "";
  const url = new URL(value);
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  return url.toString();
}

export const submissionDataSchema = z.object({
  participantName: text(180).min(1, "Enter your name."),
  participantEmail: z.string().trim().email("Enter a valid email address.").max(320),
  country: text(120).min(1, "Select or enter your country."),
  profileUrl: safeWebUrl(),
  projectName: text(180).min(1, "Enter a project name."),
  shortDescription: text(500).min(1, "Add a short project description."),
  problemSolved: text(10000).min(1, "Describe the problem your software solves."),
  category: text(100).min(1, "Select a category."),
  repositoryUrl: safeWebUrl(),
  liveUrl: safeWebUrl(),
  documentationUrl: safeWebUrl(),
  demoVideoUrl: safeWebUrl(),
  technologyStack: text(2000).min(1, "List the main technologies used."),
  projectStatus: z.enum(["In progress", "Beta", "Live", "Paused", "Archived"]),
}).superRefine((data, ctx) => {
  if (!data.repositoryUrl && !data.liveUrl && !data.documentationUrl && !data.demoVideoUrl) {
    ctx.addIssue({ code: "custom", path: ["repositoryUrl"], message: "Add at least one project evidence link." });
  }
});

export const declarationsSchema = z.object({
  rights: z.literal(true),
  thirdParty: z.literal(true),
  noGuarantee: z.literal(true),
  evaluation: z.literal(true),
  terms: z.literal(true),
});

export const urlFilterSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).max(10000).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
}).superRefine((filter, ctx) => {
  for (const [key, value] of [["from", filter.from], ["to", filter.to]] as const) {
    if (!value) continue;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      ctx.addIssue({ code: "custom", path: [key], message: "Enter a valid calendar date." });
    }
  }
  if (filter.from && filter.to && filter.from > filter.to) {
    ctx.addIssue({ code: "custom", path: ["to"], message: "The end date must be on or after the start date." });
  }
});
