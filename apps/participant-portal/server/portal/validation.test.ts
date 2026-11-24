import { describe, expect, it } from "vitest";
import {
  declarationsSchema,
  draftDataSchema,
  normalizeWebUrl,
  parsePublicGitHubRepository,
  submissionDataSchema,
  urlFilterSchema,
  VALIDATION_CHECK_IDS,
  validationOutcome,
} from "./validation";

const validSubmission = {
  participantName: "Ada Builder",
  participantEmail: "ada@example.test",
  country: "United Kingdom",
  profileUrl: "",
  projectName: "Field Notes",
  shortDescription: "A small tool for tracking field research.",
  problemSolved: "Research teams need a dependable, searchable record of field observations.",
  category: "Developer tools",
  repositoryUrl: "https://GitHub.com/ovanite/field-notes.git#readme",
  liveUrl: "",
  documentationUrl: "",
  demoVideoUrl: "",
  technologyStack: "TypeScript, React",
  projectStatus: "Beta",
};

describe("portal input validation", () => {
  it("normalizes an HTTP(S) evidence URL and removes its fragment", () => {
    expect(normalizeWebUrl("https://GitHub.com/ovanite/field-notes.git#readme")).toBe("https://github.com/ovanite/field-notes.git");
    expect(submissionDataSchema.parse(validSubmission).repositoryUrl).toBe("https://github.com/ovanite/field-notes.git");
  });

  it.each(["javascript:alert(1)", "data:text/html,hello", "https://user:secret@example.com/project", "not-a-url"])("rejects unsafe evidence URL %s", repositoryUrl => {
    expect(submissionDataSchema.safeParse({ ...validSubmission, repositoryUrl }).success).toBe(false);
  });

  it("requires at least one evidence link and a supported project status", () => {
    expect(submissionDataSchema.safeParse({ ...validSubmission, repositoryUrl: "", liveUrl: "", documentationUrl: "", demoVideoUrl: "" }).success).toBe(false);
    expect(submissionDataSchema.safeParse({ ...validSubmission, projectStatus: "In production forever" }).success).toBe(false);
  });

  it("requires every explicit declaration to be true", () => {
    const accepted = { rights: true, thirdParty: true, noGuarantee: true, evaluation: true, terms: true };
    expect(declarationsSchema.safeParse(accepted).success).toBe(true);
    expect(declarationsSchema.safeParse({ ...accepted, terms: false }).success).toBe(false);
    expect(declarationsSchema.safeParse({ rights: true }).success).toBe(false);
  });

  it("retains partial drafts without requiring final submission fields", () => {
    const draft = draftDataSchema.parse({ projectName: "First draft" });
    expect(draft.projectName).toBe("First draft");
    expect(draft.participantEmail).toBe("");
    expect(draft.repositoryUrl).toBe("");
  });

  it("passes a validation record only when every required check is explicitly true", () => {
    const complete = Object.fromEntries(VALIDATION_CHECK_IDS.map(id => [id, true]));
    expect(validationOutcome(complete)).toBe("pass");
    expect(validationOutcome({ ...complete, evidence_links_reviewed: false })).toBe("fail");
    // Fail closed on a missing check and on a non-boolean truthy value.
    const { evidence_links_reviewed: _omitted, ...missing } = complete;
    expect(validationOutcome(missing)).toBe("fail");
    expect(validationOutcome({ ...complete, rights_declaration_reviewed: "yes" as unknown as boolean })).toBe("fail");
    // Extra keys cannot substitute for a required check.
    expect(validationOutcome({ unreviewed_extra: true })).toBe("fail");
  });

  it("rejects GitHub owners that break GitHub's identifier rules", () => {
    expect(parsePublicGitHubRepository("https://github.com/trailing-/repo")).toBeNull();
    expect(parsePublicGitHubRepository("https://github.com/-leading/repo")).toBeNull();
    expect(parsePublicGitHubRepository("https://github.com/a/repo")).not.toBeNull();
  });

  it("accepts valid inclusive date filters and rejects invalid/reversed ranges", () => {
    expect(urlFilterSchema.safeParse({ from: "2026-10-01", to: "2026-10-03" }).success).toBe(true);
    expect(urlFilterSchema.safeParse({ from: "2026-02-30" }).success).toBe(false);
    expect(urlFilterSchema.safeParse({ from: "2026-10-04", to: "2026-10-03" }).success).toBe(false);
  });
});
