/**
 * Ovanite intake API — Worker entrypoint.
 *
 * Routing, CORS and request identity live here; the contract lives in
 * `core.js`. CORS is an explicit allowlist: an unknown browser origin is refused
 * rather than reflected, and no credentials are ever accepted. Attachments are
 * written to the R2 binding `FILES` and are only readable with the operator
 * token — there is no public download route.
 */
import {
  handleFileDownload,
  handleFileList,
  handleList,
  handleSubmission,
} from "./core.js";
import { ensureSchema } from "./schema.js";
import { createD1Store } from "./store-d1.js";

const DEFAULT_ALLOWED_ORIGINS = ["https://ovanite.vercel.app"];

function allowedOrigins(env) {
  const configured = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(origin, allowlist) {
  if (!origin || !allowlist.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "600",
    vary: "origin",
  };
}

/** Narrow R2 surface the contract needs: put, get, delete. */
function createR2Attachments(bucket) {
  return {
    async put(key, bytes, meta) {
      await bucket.put(key, bytes, {
        httpMetadata: { contentType: meta.contentType },
        customMetadata: {
          originalName: meta.originalName,
          submissionId: meta.submissionId,
        },
      });
    },
    async get(key) {
      return bucket.get(key);
    },
    async delete(key) {
      await bucket.delete(key);
    },
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowlist = allowedOrigins(env);
    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin, allowlist);
    const requestId = crypto.randomUUID();

    if (request.method === "OPTIONS") {
      // A preflight from an origin that is not allowlisted gets no CORS headers,
      // so the browser refuses the actual request.
      return new Response(null, { status: 204, headers: cors });
    }

    if (!env.DB) {
      return Response.json(
        { ok: false, error: "unavailable" },
        { status: 503, headers: { ...cors, "cache-control": "no-store" } },
      );
    }

    const store = createD1Store(env.DB);
    const attachments = env.FILES ? createR2Attachments(env.FILES) : null;
    const operatorDeps = { store, attachments, token: env.INTAKE_ADMIN_TOKEN };

    try {
      await ensureSchema(env.DB);

      if (url.pathname === "/healthz") {
        await store.ping();
        return Response.json(
          { ok: true },
          { headers: { ...cors, "cache-control": "no-store" } },
        );
      }

      if (url.pathname === "/api/files") {
        return await handleFileList(request, operatorDeps);
      }

      if (url.pathname.startsWith("/api/files/")) {
        return await handleFileDownload(request, operatorDeps);
      }

      if (url.pathname === "/api/intake") {
        const response =
          request.method === "GET"
            ? await handleList(request, operatorDeps)
            : await handleSubmission(request, {
                store,
                attachments,
                now: Date.now(),
                rateSalt: env.RATE_SALT ?? "ovanite-intake",
                allowedOrigins: allowlist,
                requestId,
              });
        for (const [header, value] of Object.entries(cors)) {
          response.headers.set(header, value);
        }
        return response;
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "intake_request_failed",
          requestId,
          path: url.pathname,
          message: error instanceof Error ? error.message : "unknown",
        }),
      );
      return Response.json(
        { ok: false, error: "unavailable" },
        { status: 503, headers: { ...cors, "cache-control": "no-store" } },
      );
    }

    return Response.json(
      { ok: false, error: "not_found" },
      { status: 404, headers: { ...cors, "cache-control": "no-store" } },
    );
  },
};
