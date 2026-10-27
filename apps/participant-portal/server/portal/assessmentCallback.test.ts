import { describe, expect, it } from "vitest";
import { assessmentCallbackSchema } from "./assessmentCallback";

const validReport = {
  summary: {
    totalFindings: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
    vulnerabilities: 0,
    secrets: 0,
    misconfigurations: 0,
    licenses: 0,
    gateStatus: "passed" as const,
    truncated: false,
  },
  findings: [],
};

const validCallback = {
  assessmentRunId: "76f376ec-cc9a-480e-96ca-402045b5b66c",
  sourceSha: "a".repeat(40),
  status: "completed" as const,
  workflowRunId: "123456789",
  workflowUrl: "https://github.com/Abhijeetjain4075/ovanite/actions/runs/123456789",
  startedAt: "2026-10-27T12:00:00.000Z",
  finishedAt: "2026-10-27T12:00:10.000Z",
  errorCode: null,
  report: validReport,
};

describe("assessment callback contract", () => {
  it("accepts a completed report pinned to a valid source revision and Ovanite workflow run", () => {
    expect(assessmentCallbackSchema.safeParse(validCallback).success).toBe(true);
  });

  it("requires a report for completed callbacks", () => {
    const { report: _report, ...withoutReport } = validCallback;
    expect(assessmentCallbackSchema.safeParse(withoutReport).success).toBe(false);
  });

  it("requires a safe failure code when a run fails", () => {
    const { errorCode: _errorCode, report: _report, ...withoutFailureDetails } = {
      ...validCallback,
      status: "failed" as const,
    };
    expect(assessmentCallbackSchema.safeParse(withoutFailureDetails).success).toBe(false);
  });

  it("rejects non-GitHub, sibling-host, or incorrect-repository workflow URLs", () => {
    for (const workflowUrl of [
      "http://github.com/Abhijeetjain4075/ovanite/actions/runs/123",
      "https://github.com.evil.example/Abhijeetjain4075/ovanite/actions/runs/123",
      "https://github.com/another-owner/another-repo/actions/runs/123",
      "https://github.com/Abhijeetjain4075/ovanite/actions/runs/not-a-number",
    ]) {
      expect(assessmentCallbackSchema.safeParse({ ...validCallback, workflowUrl }).success).toBe(false);
    }
  });

  it("rejects malformed source revisions and unknown payload fields", () => {
    expect(assessmentCallbackSchema.safeParse({ ...validCallback, sourceSha: "main" }).success).toBe(false);
    expect(assessmentCallbackSchema.safeParse({ ...validCallback, rawScannerOutput: "must-not-be-accepted" }).success).toBe(false);
  });

  it("rejects oversized or malformed finding fields and non-HTTPS references", () => {
    const finding = {
      tool: "Trivy",
      type: "vulnerability" as const,
      severity: "HIGH" as const,
      ruleId: "CVE-2026-00001",
      title: "Example finding",
      message: "A sanitized advisory description.",
      path: "package-lock.json",
      referenceUrl: "https://example.com/security/advisory",
    };
    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      report: { ...validReport, summary: { ...validReport.summary, totalFindings: 1, high: 1, vulnerabilities: 1 }, findings: [finding] },
    }).success).toBe(true);

    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      report: { ...validReport, findings: [{ ...finding, referenceUrl: "http://example.com/advisory" }] },
    }).success).toBe(false);

    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      report: { ...validReport, findings: [{ ...finding, unexpectedRawSecret: "must-not-be-accepted" }] },
    }).success).toBe(false);

    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      report: { ...validReport, findings: Array(201).fill(finding) },
    }).success).toBe(false);
  });
});
