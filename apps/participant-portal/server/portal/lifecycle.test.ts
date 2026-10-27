import { describe, expect, it } from "vitest";
import { canTransition } from "./lifecycle";
import { normalizeWebUrl, parsePublicGitHubRepository, submissionDataSchema } from "./validation";

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

  it("rejects non-http schemes, malformed URLs, and credential-bearing URLs", () => {
    expect(submissionDataSchema.safeParse({ ...valid, repositoryUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(submissionDataSchema.safeParse({ ...valid, repositoryUrl: "not a URL" }).success).toBe(false);
    expect(submissionDataSchema.safeParse({ ...valid, repositoryUrl: "https://user:pass@example.com/project" }).success).toBe(false);
  });

  it("normalizes URL host casing and strips fragments before duplicate comparison", () => {
    expect(normalizeWebUrl("HTTPS://GitHub.COM/example/repo#readme")).toBe("https://github.com/example/repo");
  });

  it("rejects unsupported schemes and URL values beyond the size limit", () => {
    expect(submissionDataSchema.safeParse({ ...valid, liveUrl: "file:///etc/passwd" }).success).toBe(false);
    expect(submissionDataSchema.safeParse({ ...valid, liveUrl: `https://example.com/${"a".repeat(2050)}` }).success).toBe(false);
  });
});

describe("public GitHub repository parsing", () => {
  it("accepts canonical GitHub repository URLs and strips a .git suffix", () => {
    expect(parsePublicGitHubRepository("https://github.com/ExampleOwner/project.git")).toEqual({
      owner: "ExampleOwner",
      name: "project",
      fullName: "ExampleOwner/project",
    });
  });

  it("rejects non-GitHub hosts, subpaths, credentials, ports, query strings, and malformed owners", () => {
    for (const value of [
      "http://github.com/owner/repo",
      "https://github.evil.example/owner/repo",
      "https://github.com/owner/repo/tree/main",
      "https://user:pass@github.com/owner/repo",
      "https://github.com:8443/owner/repo",
      "https://github.com/owner/repo?redirect=https://example.com",
      "https://github.com/../repo",
    ]) {
      expect(parsePublicGitHubRepository(value)).toBeNull();
    }
  });
});
