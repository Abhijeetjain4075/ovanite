import type { Express } from "express";
import { ENV } from "./env";
import { describeOperationalFailure } from "./redact";
import { normalizeStorageKey } from "./storageKeys";

const MAX_SIGNED_URL_LENGTH = 4096;
const MAX_UPSTREAM_JSON_BYTES = 8 * 1024;
const UPSTREAM_TIMEOUT_MS = 5_000;
const PUBLIC_STORAGE_PREFIX = "generated/";

export function resolveSignedRedirect(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length === 0 || value.length > MAX_SIGNED_URL_LENGTH) return null;
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || parsed.username !== "" || parsed.password !== "") {
    return null;
  }
  if (!parsed.hostname || parsed.hostname.endsWith(".")) return null;
  return parsed.toString();
}

function forgeBaseUrl(): URL | null {
  if (!ENV.forgeApiUrl) return null;
  try {
    const parsed = new URL(ENV.forgeApiUrl);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string | null> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    return null;
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    return null;
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const rawKey = (req.params as Record<string, string>)[0];
    if (!rawKey) {
      res.status(400).send("Missing storage key");
      return;
    }

    const key = normalizeStorageKey(rawKey);
    if (!key) {
      res.status(400).send("Invalid storage key");
      return;
    }
    // This unauthenticated route is only for generated, public site assets.
    // It must never act as a general-purpose presign oracle for private objects.
    if (!key.startsWith(PUBLIC_STORAGE_PREFIX)) {
      res.status(404).send("Not found");
      return;
    }

    const base = forgeBaseUrl();
    if (!base || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL("v1/storage/presign/get", base.toString().replace(/\/+$/, "") + "/");
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: {
          Authorization: `Bearer ${ENV.forgeApiKey}`,
          Accept: "application/json",
        },
        redirect: "error",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (!forgeResp.ok) {
        console.error(`[StorageProxy] upstream request failed (status=${forgeResp.status}).`);
        res.status(502).send("Storage backend error");
        return;
      }

      const contentType = forgeResp.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
      if (contentType !== "application/json") {
        console.error("[StorageProxy] upstream returned an unexpected content type.");
        res.status(502).send("Storage backend error");
        return;
      }
      const responseBody = await readBoundedText(forgeResp, MAX_UPSTREAM_JSON_BYTES);
      if (responseBody === null) {
        console.error("[StorageProxy] upstream response exceeded the JSON safety bound.");
        res.status(502).send("Storage backend error");
        return;
      }

      let payload: unknown;
      try {
        payload = JSON.parse(responseBody);
      } catch {
        res.status(502).send("Storage backend error");
        return;
      }
      const rawUrl = typeof payload === "object" && payload !== null
        ? (payload as { url?: unknown }).url
        : null;
      const target = resolveSignedRedirect(rawUrl);
      if (!target) {
        console.error("[StorageProxy] backend returned an unusable signed URL.");
        res.status(502).send("Storage backend error");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.set("Referrer-Policy", "no-referrer");
      res.redirect(307, target);
    } catch (error) {
      console.error(describeOperationalFailure("storage_proxy", error));
      res.status(502).send("Storage proxy error");
    }
  });
}
