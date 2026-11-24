import type { Express } from "express";
import { ENV } from "./env";
import { describeOperationalFailure } from "./redact";
import { normalizeStorageKey } from "./storageKeys";

/** Signed download URLs are absolute HTTP(S) URLs without embedded credentials. */
const MAX_SIGNED_URL_LENGTH = 4096;

/**
 * Validate the URL returned by the storage backend before it becomes a redirect.
 *
 * The value is trusted infrastructure output, but a compromised or
 * misconfigured presign endpoint must not be able to turn this public route into
 * an open redirect (or a `javascript:`/`data:` sink). Only absolute HTTP(S)
 * URLs without credentials or control characters are allowed.
 */
export function resolveSignedRedirect(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length === 0 || value.length > MAX_SIGNED_URL_LENGTH) return null;
  // Reject control characters and whitespace outright: a browser would strip
  // some of them, so the parsed origin could differ from the one we validated.
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (parsed.username !== "" || parsed.password !== "") return null;
  if (parsed.hostname === "") return null;
  return parsed.toString();
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const rawKey = (req.params as Record<string, string>)[0];
    if (!rawKey) {
      res.status(400).send("Missing storage key");
      return;
    }

    // This route forwards the key to the presign endpoint. Validate it here so a
    // crafted `..`-style or absolute key is refused before any upstream call.
    const key = normalizeStorageKey(rawKey);
    if (!key) {
      res.status(400).send("Invalid storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        console.error(`[StorageProxy] upstream request failed (status=${forgeResp.status}).`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: unknown };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      const target = resolveSignedRedirect(url);
      if (!target) {
        // Log only the shape of the failure, never the untrusted URL itself.
        console.error("[StorageProxy] backend returned an unusable signed URL.");
        res.status(502).send("Storage backend error");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, target);
    } catch (err) {
      console.error(describeOperationalFailure("storage_proxy", err));
      res.status(502).send("Storage proxy error");
    }
  });
}
