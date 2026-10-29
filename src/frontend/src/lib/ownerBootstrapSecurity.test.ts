import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const backendRoot = resolve(process.cwd(), "../backend");
const adminLibrary = readFileSync(resolve(backendRoot, "lib/admin.mo"), "utf8");
const adminApi = readFileSync(
  resolve(backendRoot, "mixins/admin-api.mo"),
  "utf8",
);

describe("owner bootstrap security invariant", () => {
  it("defaults to a closed bootstrap until an operator principal is configured", () => {
    expect(adminLibrary).toContain(
      "public let ownerPrincipalText : ?Text = null;",
    );
    expect(adminApi).toContain(
      "not AdminLib.isEmpty(admins) or not AdminLib.isOwnerBootstrapConfigured()",
    );
  });

  it("requires the caller principal to match the configured owner before checking email", () => {
    const configuredPrincipalCheck = adminApi.indexOf(
      "if (not AdminLib.isConfiguredOwner(caller))",
    );
    const emailCheck = adminApi.indexOf("if (email != AdminLib.ownerEmail)");

    expect(configuredPrincipalCheck).toBeGreaterThan(-1);
    expect(emailCheck).toBeGreaterThan(-1);
    expect(configuredPrincipalCheck).toBeLessThan(emailCheck);
    expect(adminLibrary).toContain(
      "expected != \"\" and Principal.toText(principal) == expected;",
    );
  });

  it("does not let the pure ownership claim helper grant a different principal", () => {
    expect(adminLibrary).toContain(
      "if (not isConfiguredOwner(principal)) { return false };",
    );
  });
});
