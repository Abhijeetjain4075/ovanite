import { describe, expect, it } from "vitest";
import { describeDatabaseError, describeDatabaseOperation, describeOperationalFailure } from "./redact";

describe("describeDatabaseError", () => {
  it("classifies duplicate-key failures without exposing bound values", () => {
    const error = Object.assign(new Error("Duplicate entry 'participant@example.com'"), {
      code: "ER_DUP_ENTRY",
      sql: "INSERT INTO users VALUES ('secret-open-id')",
    });
    const d = describeDatabaseError(error);
    expect(d).toEqual({ name: "Error", code: "ER_DUP_ENTRY", category: "constraint" });
    expect(JSON.stringify(d)).not.toContain("participant@example.com");
    expect(JSON.stringify(d)).not.toContain("secret-open-id");
  });

  it("classifies known authentication, connection, timeout and capacity failures", () => {
    expect(describeDatabaseError({ code: "ER_ACCESS_DENIED_ERROR" }).category).toBe("authentication");
    expect(describeDatabaseError({ code: "ECONNREFUSED" }).category).toBe("connection");
    expect(describeDatabaseError({ code: "ETIMEDOUT" }).category).toBe("timeout");
    expect(describeDatabaseError({ code: "ER_CON_COUNT_ERROR" }).category).toBe("unavailable");
  });

  it("does not accept arbitrary strings just because they resemble codes", () => {
    expect(describeDatabaseError({ code: "ER_BAD_THING" }).code).toBeNull();
    expect(describeDatabaseError({ code: "ER_BAD_THING; DROP TABLE users" }).code).toBeNull();
  });

  it("rejects unsafe names and non-object throws", () => {
    expect(describeDatabaseError({ name: "mysql://root:hunter2@db.internal/prod" }))
      .toEqual({ name: "Error", code: null, category: "unknown" });
    expect(describeDatabaseError("boom")).toEqual({ name: "Error", code: null, category: "unknown" });
  });

  it("does not execute hostile getters", () => {
    const hostile = new Proxy({}, { get() { throw new Error("private-value"); } });
    expect(describeDatabaseError(hostile)).toEqual({ name: "Error", code: null, category: "unknown" });
  });
});

describe("safe logging helpers", () => {
  it("redacts database messages, SQL, credentials and hosts", () => {
    const log = describeDatabaseOperation("upsertUser",
      Object.assign(new Error("mysql://user:pass@10.0.0.5/db"), { code: "ECONNREFUSED" }));
    expect(log).toBe("[Database] upsertUser failed (name=Error, code=ECONNREFUSED, category=connection)");
    expect(log).not.toContain("pass");
    expect(log).not.toContain("10.0.0.5");
  });

  it("redacts operational exception messages", () => {
    const log = describeOperationalFailure("oauth_sync",
      Object.assign(new Error("https://db.internal/token?secret=abc"), { code: "ETIMEDOUT" }));
    expect(log).toBe("[Operation] oauth_sync failed (name=Error, code=ETIMEDOUT, category=timeout)");
    expect(log).not.toContain("db.internal");
    expect(log).not.toContain("secret=abc");
  });
});
