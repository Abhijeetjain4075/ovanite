import { describe, expect, it } from "vitest";
import { canTransition } from "./lifecycle";
import { submissionDataSchema } from "./validation";

describe("submission lifecycle", () => {
  it("allows only explicit forward transitions", () => {
    expect(canTransition("draft", "submitted")).toBe(true);
    expect(canTransition("submitted", "terms_accepted")).toBe(true);
    expect(canTransition("terms_accepted", "validation")).toBe(true);
    expect(canTransition("validation", "evaluation")).toBe(true);
    expect(canTransition("evaluation", "eligible")).toBe(true);
    expect(canTransition("eligible", "selected")).toBe(true);
    expect(canTransition("selected", "archived")).toBe(true);
  });

  it("rejects skips, reversals, and reopening terminal states", () => {
    expect(canTransition("draft", "evaluation")).toBe(false);
    expect(canTransition("terms_accepted", "selected")).toBe(false);
    expect(canTransition("not_eligible", "selected")).toBe(false);
    expect(canTransition("rejected", "evaluation")).toBe(false);
    expect(canTransition("archived", "validation")).toBe(false);
  });
});

describe("submission evidence validation", () => {
  const valid = {
    participantName: "A. Builder",
    participantEmail: "builder@example.com",
    country: "Canada",
    profileUrl: "",
    projectName: "Field Notes",
    shortDescription: "A tool for recording field observations.",
    problemSolved: "Researchers need a reliable way to record observations.",
    category: "Education",
    repositoryUrl: "https://github.com/example/field-notes",
    liveUrl: "",
    documentationUrl: "",
    demoVideoUrl: "",
    technologyStack: "TypeScript, React",
    projectStatus: "Beta",
  };

  it("accepts a complete submission with safe evidence URLs", () => {
    expect(submissionDataSchema.safeParse(valid).success).toBe(true);
  });

  it("requires at least one evidence URL", () => {
    expect(submissionDataSchema.safeParse({ ...valid, repositoryUrl: "" }).success).toBe(false);
  });

  it("rejects non-http schemes and credential-bearing URLs", () => {
    expect(submissionDataSchema.safeParse({ ...valid, repositoryUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(submissionDataSchema.safeParse({ ...valid, repositoryUrl: "https://user:pass@example.com/project" }).success).toBe(false);
  });
});
