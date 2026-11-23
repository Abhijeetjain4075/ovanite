import { createServer, type Server } from "node:http";
import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * HTTP-level regression coverage for the assessment callback.
 *
 * The existing unit suite exercises schema parsing and transition policy only.
 * These tests mount the real Express middleware order and the real handler so a
 * regression in body parsing, bearer handling, size limits or ordering fails CI.
 */

const getDb = vi.fn(async () => null);
vi.mock("../db", () => ({ getDb: () => getDb() }));

vi.mock("../_core/env", () => ({
  ENV: {
    get assessmentCallbackSecret() {
      return process.env.OVANITE_ASSESSMENT_CALLBACK_SECRET ?? "";
    },
  },
}));

const { assessmentCallbackHandler } = await import("./assessmentCallback");

const SECRET = "test-callback-secret";
let server: Server;
let baseUrl = "";

function buildApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "32kb", extended: false, parameterLimit: 100 }));
  app.post("/api/assessment/callback", (req, res, next) => {
    void assessmentCallbackHandler(req, res).catch(next);
  });
  return app;
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    assessmentRunId: "76f376ec-cc9a-480e-96ca-402045b5b66c",
    sourceRepository: "ExampleOwner/example-repo",
    sourceSha: "a".repeat(40),
    status: "running",
    workflowRunId: "123456789",
    workflowUrl: "https://github.com/Abhijeetjain4075/ovanite/actions/runs/123456789",
    startedAt: "2026-10-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("assessment callback over HTTP", () => {
  beforeAll(async () => {
    server = createServer(buildApp());
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  beforeEach(() => {
    process.env.OVANITE_ASSESSMENT_CALLBACK_SECRET = SECRET;
    getDb.mockClear();
  });

  it("rejects a missing bearer credential without reaching the database", async () => {
    const response = await fetch(`${baseUrl}/api/assessment/callback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload()),
    });
    expect(response.status).toBe(401);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("rejects a wrong bearer credential in constant-time comparison path", async () => {
    const response = await fetch(`${baseUrl}/api/assessment/callback`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}-wrong` },
      body: JSON.stringify(validPayload()),
    });
    expect(response.status).toBe(401);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("parses the JSON body and reaches the database (proves middleware order)", async () => {
    const response = await fetch(`${baseUrl}/api/assessment/callback`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
      body: JSON.stringify(validPayload()),
    });
    // getDb returns null in this test double, so the handler must answer 503 —
    // which is only reachable after schema validation succeeds.
    expect(response.status).toBe(503);
    expect(getDb).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ error: "Assessment database is unavailable." });
  });

  it("rejects a malformed body with 400 rather than a crash", async () => {
    const response = await fetch(`${baseUrl}/api/assessment/callback`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
      body: JSON.stringify({ status: "running" }),
    });
    expect(response.status).toBe(400);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("rejects a body over the parser limit with 413", async () => {
    const response = await fetch(`${baseUrl}/api/assessment/callback`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
      body: JSON.stringify(validPayload({ padding: "x".repeat(1_200_000) })),
    });
    expect(response.status).toBe(413);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("fails closed when the callback secret is not configured", async () => {
    delete process.env.OVANITE_ASSESSMENT_CALLBACK_SECRET;
    const response = await fetch(`${baseUrl}/api/assessment/callback`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer anything" },
      body: JSON.stringify(validPayload()),
    });
    expect(response.status).toBe(503);
    expect(getDb).not.toHaveBeenCalled();
  });
});
