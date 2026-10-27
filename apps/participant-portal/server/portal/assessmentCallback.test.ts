import { describe, expect, it } from "vitest";
import { assessmentCallbackSchema, decideAssessmentCallbackTransition } from "./assessmentCallback";

const validReport = {
  sbom: {
    format: "CycloneDX" as const,
    componentCount: 0,
    sha256: "b".repeat(64),
    fileName: "candidate.sbom.cdx.json" as const,
  },
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
  sourceRepository: "ExampleOwner/example-repo",
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
    expect(assessmentCallbackSchema.safeParse({ ...validCallback, sourceRepository: "https://example.com/owner/repo" }).success).toBe(false);
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
      report: { ...validReport, summary: { ...validReport.summary, totalFindings: 1, high: 1, vulnerabilities: 1, gateStatus: "blocked" }, findings: [finding] },
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

  it("requires a valid CycloneDX SBOM digest and rejects untrusted SBOM filenames", () => {
    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      report: { ...validReport, sbom: { ...validReport.sbom, sha256: "not-a-digest" } },
    }).success).toBe(false);
    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      report: { ...validReport, sbom: { ...validReport.sbom, fileName: "../../secrets.txt" } },
    }).success).toBe(false);
  });

  it("requires consistent severity/category totals and a gate that matches findings", () => {
    const highFinding = {
      tool: "Trivy", type: "vulnerability" as const, severity: "HIGH" as const,
      ruleId: "CVE-2026-00002", title: "High severity", message: "A finding.",
      path: "lockfile.yaml",
    };
    const blocked = {
      ...validReport,
      summary: { ...validReport.summary, totalFindings: 1, high: 1, vulnerabilities: 1, gateStatus: "blocked" as const },
      findings: [highFinding],
    };
    expect(assessmentCallbackSchema.safeParse({ ...validCallback, report: blocked }).success).toBe(true);
    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      report: { ...blocked, summary: { ...blocked.summary, gateStatus: "passed" } },
    }).success).toBe(false);
    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      report: { ...blocked, summary: { ...blocked.summary, high: 0 } },
    }).success).toBe(false);
    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      report: { ...blocked, summary: { ...blocked.summary, vulnerabilities: 0 } },
    }).success).toBe(false);
  });

  it("treats unknown severity as review-required, not a clean pass", () => {
    const unknownFinding = {
      tool: "Trivy", type: "vulnerability" as const, severity: "UNKNOWN" as const,
      ruleId: "UNCLASSIFIED", title: "Unclassified finding", message: "Severity data unavailable.",
      path: "manifest.json",
    };
    const report = {
      sbom: validReport.sbom,
      summary: {
        ...validReport.summary, totalFindings: 1, unknown: 1, vulnerabilities: 1,
        gateStatus: "review" as const,
      },
      findings: [unknownFinding],
    };
    expect(assessmentCallbackSchema.safeParse({ ...validCallback, report }).success).toBe(true);
    expect(assessmentCallbackSchema.safeParse({
      ...validCallback, report: { ...report, summary: { ...report.summary, gateStatus: "passed" } },
    }).success).toBe(false);
  });

  it("requires valid callback lifecycle timestamps and a start time for running status", () => {
    const { report: _report, finishedAt: _finishedAt, errorCode: _errorCode, ...runningPayload } = {
      ...validCallback,
      status: "running" as const,
    };
    expect(assessmentCallbackSchema.safeParse(runningPayload).success).toBe(true);
    expect(assessmentCallbackSchema.safeParse({ ...runningPayload, startedAt: undefined }).success).toBe(false);
    expect(assessmentCallbackSchema.safeParse({
      ...validCallback,
      startedAt: "2026-10-27T12:00:20.000Z",
      finishedAt: "2026-10-27T12:00:10.000Z",
    }).success).toBe(false);
  });

  it("requires the workflow URL run ID to equal the callback run ID", () => {
    expect(assessmentCallbackSchema.safeParse({ ...validCallback, workflowUrl: "https://github.com/Abhijeetjain4075/ovanite/actions/runs/999999999" }).success).toBe(false);
  });

  it("rejects workflow URLs with credentials, ports, queries, or fragments", () => {
    for (const workflowUrl of [
      "https://user:pass@github.com/Abhijeetjain4075/ovanite/actions/runs/123",
      "https://github.com:8443/Abhijeetjain4075/ovanite/actions/runs/123",
      "https://github.com/Abhijeetjain4075/ovanite/actions/runs/123?redirect=https://example.com",
      "https://github.com/Abhijeetjain4075/ovanite/actions/runs/123#fragment",
    ]) {
      expect(assessmentCallbackSchema.safeParse({ ...validCallback, workflowUrl }).success).toBe(false);
    }
  });
});

describe("assessment callback state transitions", () => {
  const workflowRunId = "123456789";

  it("permits only queued/dispatched to running and running to terminal transitions", () => {
    expect(decideAssessmentCallbackTransition("queued", null, "running", workflowRunId)).toBe("update");
    expect(decideAssessmentCallbackTransition("dispatched", null, "running", workflowRunId)).toBe("update");
    expect(decideAssessmentCallbackTransition("running", workflowRunId, "completed", workflowRunId)).toBe("update");
    expect(decideAssessmentCallbackTransition("running", workflowRunId, "failed", workflowRunId)).toBe("update");
    expect(decideAssessmentCallbackTransition("queued", null, "completed", workflowRunId)).toBe("invalid_transition");
    expect(decideAssessmentCallbackTransition("dispatched", null, "failed", workflowRunId)).toBe("update");
    expect(decideAssessmentCallbackTransition("queued", null, "failed", workflowRunId)).toBe("update");
  });

  it("makes duplicate callbacks idempotent without allowing another workflow to rewrite a run", () => {
    expect(decideAssessmentCallbackTransition("running", workflowRunId, "running", workflowRunId)).toBe("already_running");
    expect(decideAssessmentCallbackTransition("completed", workflowRunId, "completed", workflowRunId)).toBe("already_terminal");
    expect(decideAssessmentCallbackTransition("failed", workflowRunId, "failed", workflowRunId)).toBe("already_terminal");
    expect(decideAssessmentCallbackTransition("running", workflowRunId, "completed", "987654321")).toBe("workflow_mismatch");
    expect(decideAssessmentCallbackTransition("completed", workflowRunId, "running", workflowRunId)).toBe("terminal_conflict");
  });
});
