import { describe, expect, it } from "vitest";
import { describeDatabaseError, describeDatabaseOperation } from "./redact";

describe("describeDatabaseError", () => {
  it("classifies a duplicate-key constraint failure without exposing values", () => {
    const error = Object.assign(new Error("Duplicate entry 'participant@example.com' for key 'users.openId'"), {
      name: "Error",
      code: "ER_DUP_ENTRY",
      sql: "INSERT INTO users (openId, email) VALUES ('secret-open-id', 'participant@example.com')",
    });
    const description = describeDatabaseError(error);
    expect(description).toEqual({ name: "Error", code: "ER_DUP_ENTRY", category: "constraint" });
    expect(JSON.stringify(description)).not.toContain("participant@example.com");
    expect(JSON.stringify(description)).not.toContain("secret-open-id");
  });

  it("classifies access-denied and connection failures", () => {
    expect(describeDatabaseError({ code: "ER_ACCESS_DENIED_ERROR" }).category).toBe("authentication");
    expect(describeDatabaseError({ code: "ECONNREFUSED" }).category).toBe("connection");
    expect(describeDatabaseError({ code: "ETIMEDOUT" }).category).toBe("timeout");
    expect(describeDatabaseError({ code: "ER_CON_COUNT_ERROR" }).category).toBe("unavailable");
  });

  it("drops unsafe names and codes instead of passing them through", () => {
    const description = describeDatabaseError({
      name: "mysql://root:hunter2@db.internal/prod",
      code: "ER_BAD_THING; DROP TABLE users",
    });
    expect(description.name).toBe("Error");
    expect(description.code).toBeNull();
    expect(JSON.stringify(description)).not.toContain("hunter2");
    expect(JSON.stringify(description)).not.toContain("db.internal");
  });

  it("handles non-object throws", () => {
    expect(describeDatabaseError("boom")).toEqual({ name: "Error", code: null, category: "unknown" });
    expect(describeDatabaseError(undefined)).toEqual({ name: "Error", code: null, category: "unknown" });
  });
});

describe("describeDatabaseOperation", () => {
  it("produces one line with no credentials, host or SQL", () => {
    const line = describeDatabaseOperation(
      "upsertUser",
      Object.assign(new Error("connect ECONNREFUSED mysql://user:pass@10.0.0.5:3306/ovanite"), {
        code: "ECONNREFUSED",
      }),
    );
    expect(line).toBe("[Database] upsertUser failed (name=Error, code=ECONNREFUSED, category=connection)");
    expect(line).not.toContain("pass");
    expect(line).not.toContain("10.0.0.5");
    expect(line).not.toContain("mysql://");
  });
});
