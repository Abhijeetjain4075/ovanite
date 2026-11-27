import assert from "node:assert/strict";
import { describe, it } from "node:test";

import worker, { allowedOrigins, corsHeaders, refusalHeaders } from "../src/worker.js";

const ALLOWED = "https://ovanite.vercel.app";
const OTHER = "https://ovanite-git-main-example.vercel.app";

function preflight(origin) {
  return new Request("https://intake.example.test/api/intake", {
    method: "OPTIONS",
    headers: {
      origin,
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type",
    },
  });
}

describe("origin handling", () => {
  it("defaults to the canonical site and accepts a configured allowlist", () => {
    assert.deepEqual(allowedOrigins({}), [ALLOWED]);
    assert.deepEqual(
      allowedOrigins({ ALLOWED_ORIGINS: " https://a.test , https://b.test " }),
      ["https://a.test", "https://b.test"],
    );
  });

  it("grants nothing to an origin outside the allowlist", () => {
    assert.deepEqual(corsHeaders(OTHER, [ALLOWED]), {});
    assert.deepEqual(corsHeaders(null, [ALLOWED]), {});
  });

  it("lets a refused origin read the refusal instead of an opaque failure", async () => {
    const response = await worker.fetch(preflight(OTHER), {});
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), OTHER);
    // Nothing beyond the refusal is granted: no credentials, no other methods.
    assert.equal(response.headers.get("access-control-allow-credentials"), null);
    assert.equal(response.headers.get("access-control-allow-methods"), "POST, OPTIONS");
  });

  it("keeps the full contract for an allowlisted origin", async () => {
    const response = await worker.fetch(preflight(ALLOWED), {});
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), ALLOWED);
    assert.match(
      String(response.headers.get("access-control-allow-methods")),
      /GET, POST, OPTIONS/,
    );
    assert.match(
      String(response.headers.get("access-control-allow-headers")),
      /authorization/,
    );
  });

  it("describes a refusal without granting a readable route", () => {
    const headers = refusalHeaders(OTHER);
    assert.equal(headers["access-control-allow-origin"], OTHER);
    assert.equal(headers["access-control-allow-headers"], "content-type");
    assert.deepEqual(refusalHeaders(null), {});
  });
});
