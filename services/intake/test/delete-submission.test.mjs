import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  deleteSubmission,
  findExpired,
  purgeExpired,
} from "../scripts/delete-submission.mjs";

const TOKEN = "t".repeat(40);
const REFERENCE = "df96e095-2f0b-4935-a8ad-e9b8ea208633";

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

describe("deleteSubmission", () => {
  it("sends an authenticated DELETE and reports what was removed", async () => {
    const calls = [];
    const result = await deleteSubmission({
      reference: REFERENCE,
      token: TOKEN,
      origin: "https://intake.example.test",
      fetcher: async (url, init) => {
        calls.push({ url, init });
        return jsonResponse(200, {
          ok: true,
          status: "deleted",
          reference: REFERENCE,
          attachments: 2,
        });
      },
    });

    assert.deepEqual(result, { reference: REFERENCE, attachments: 2 });
    assert.equal(calls[0].url, `https://intake.example.test/api/intake/${REFERENCE}`);
    assert.equal(calls[0].init.method, "DELETE");
    assert.equal(calls[0].init.headers.authorization, `Bearer ${TOKEN}`);
  });

  it("refuses a malformed reference before any request", async () => {
    await assert.rejects(
      () =>
        deleteSubmission({
          reference: "../../etc/passwd",
          token: TOKEN,
          fetcher: async () => {
            throw new Error("should not be called");
          },
        }),
      /reference \(UUID\) is required/,
    );
  });

  it("refuses a short token before any request", async () => {
    await assert.rejects(
      () =>
        deleteSubmission({
          reference: REFERENCE,
          token: "short",
          fetcher: async () => {
            throw new Error("should not be called");
          },
        }),
      /at least 40 characters|at least 32 characters/,
    );
  });

  it("never reports success for a rejected or missing record", async () => {
    for (const [status, pattern] of [
      [401, /rejected the operator token/],
      [404, /No submission with reference/],
      [500, /failed with HTTP 500/],
    ]) {
      await assert.rejects(
        () =>
          deleteSubmission({
            reference: REFERENCE,
            token: TOKEN,
            fetcher: async () => jsonResponse(status, { ok: false }),
          }),
        pattern,
      );
    }
  });

  it("lists only records past the retention window", async () => {
    const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    const fresh = new Date().toISOString();
    const expired = await findExpired({
      token: TOKEN,
      olderThanDays: 365,
      fetcher: async () =>
        jsonResponse(200, {
          ok: true,
          rows: [
            { id: REFERENCE, kind: "contact", created_at: old },
            {
              id: "11111111-1111-4111-8111-111111111111",
              kind: "waitlist",
              created_at: fresh,
            },
          ],
        }),
    });
    assert.deepEqual(
      expired.map((row) => row.id),
      [REFERENCE],
    );
  });

  it("never deletes during a purge dry run", async () => {
    const calls = [];
    const result = await purgeExpired({
      token: TOKEN,
      olderThanDays: 365,
      fetcher: async (url) => {
        calls.push(url);
        return jsonResponse(200, {
          ok: true,
          rows: [
            {
              id: REFERENCE,
              kind: "contact",
              created_at: new Date(
                Date.now() - 400 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
          ],
        });
      },
    });

    assert.equal(result.dryRun, true);
    assert.equal(result.deleted.length, 0);
    assert.equal(calls.length, 1);
  });

  it("deletes each expired record when confirmed", async () => {
    const methods = [];
    const result = await purgeExpired({
      token: TOKEN,
      olderThanDays: 365,
      confirm: true,
      fetcher: async (url, init) => {
        methods.push(init?.method ?? "GET");
        if (init?.method === "DELETE") {
          return jsonResponse(200, {
            ok: true,
            status: "deleted",
            reference: REFERENCE,
            attachments: 0,
          });
        }
        return jsonResponse(200, {
          ok: true,
          rows: [
            {
              id: REFERENCE,
              kind: "contact",
              created_at: new Date(
                Date.now() - 400 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
          ],
        });
      },
    });

    assert.equal(result.dryRun, false);
    assert.equal(result.deleted.length, 1);
    assert.deepEqual(methods, ["GET", "DELETE"]);
  });

  it("requires a deletion confirmation in the body", async () => {
    await assert.rejects(
      () =>
        deleteSubmission({
          reference: REFERENCE,
          token: TOKEN,
          fetcher: async () => jsonResponse(200, { ok: true, status: "received" }),
        }),
      /did not confirm the deletion/,
    );
  });
});
