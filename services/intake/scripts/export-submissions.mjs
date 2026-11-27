#!/usr/bin/env node
/**
 * Downloads every stored submission, plus its attachments, into a local folder.
 *
 * The intake service keeps records in D1 and files in R2 and exposes them only
 * through its token-protected operator routes. This script is the operator side
 * of that contract: it needs `INTAKE_ADMIN_TOKEN` and nothing else, writes the
 * records to `submissions.json` and each attachment under
 * `attachments/<reference>/`, and never prints the token.
 *
 * Files are written with mode 0600 because submissions contain personal data;
 * retention and deletion follow docs/operations/backup-and-retention.md.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_ORIGIN = "https://ovanite-intake-gn5iks.freebuff.site";
export const MIN_TOKEN_LENGTH = 32;

/** Keeps a stored name safe as a single path segment under the export folder. */
export function safeFileName(name) {
  const raw = typeof name === "string" ? name : "";
  const base = raw.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the point
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned === "." || cleaned === "..") return "attachment";
  return cleaned.length > 120 ? cleaned.slice(cleaned.length - 120) : cleaned;
}

async function readJson(response, what) {
  if (response.status === 401) {
    throw new Error(
      `The intake service rejected the operator token (401) while reading ${what}. ` +
        "Rotate INTAKE_ADMIN_TOKEN and set the same value on the service.",
    );
  }
  if (!response.ok) {
    throw new Error(`Reading ${what} failed with HTTP ${response.status}.`);
  }
  return response.json();
}

/**
 * Lists submissions and downloads their attachments.
 *
 * Returns `{ count, outDir, submissions }` where each submission carries the
 * stored row and the relative path of every attachment written.
 */
export async function exportSubmissions({
  origin = DEFAULT_ORIGIN,
  token,
  outDir,
  fetcher = fetch,
  limit = 200,
  log = () => {},
} = {}) {
  if (typeof token !== "string" || token.length < MIN_TOKEN_LENGTH) {
    throw new Error(
      `An operator token of at least ${MIN_TOKEN_LENGTH} characters is required.`,
    );
  }
  if (!outDir) throw new Error("An output directory is required.");

  const base = new URL(origin).origin;
  const authorization = { authorization: `Bearer ${token}` };
  const listUrl = `${base}/api/intake?limit=${encodeURIComponent(String(limit))}`;

  const listing = await readJson(
    await fetcher(listUrl, { headers: authorization, cache: "no-store" }),
    "the submission list",
  );
  const rows = Array.isArray(listing?.rows) ? listing.rows : [];

  const root = resolve(outDir);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const submissionsPath = join(root, "submissions.json");
  await writeFile(submissionsPath, `${JSON.stringify(rows, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  log(`Wrote ${rows.length} submission(s) to ${submissionsPath}`);

  const exported = [];
  for (const row of rows) {
    const reference = String(row.id ?? "");
    const files = await readJson(
      await fetcher(
        `${base}/api/files?submission=${encodeURIComponent(reference)}`,
        { headers: authorization, cache: "no-store" },
      ),
      `the attachments of ${reference}`,
    );

    const written = [];
    for (const file of Array.isArray(files?.files) ? files.files : []) {
      const response = await fetcher(
        `${base}/api/files/${encodeURIComponent(String(file.id))}`,
        { headers: authorization, cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error(
          `Downloading ${file.name} of ${reference} failed with HTTP ${response.status}.`,
        );
      }
      const relative = join("attachments", reference, safeFileName(file.name));
      const target = join(root, relative);
      await mkdir(dirname(target), { recursive: true, mode: 0o700 });
      await writeFile(target, new Uint8Array(await response.arrayBuffer()), {
        mode: 0o600,
      });
      written.push({ name: file.name, size: file.size, path: relative });
    }

    exported.push({
      id: reference,
      kind: row.kind,
      createdAt: row.created_at ?? row.createdAt ?? null,
      attachments: written,
    });
    log(`  ${reference}  ${row.kind ?? "?"}  ${written.length} attachment(s)`);
  }

  return { count: rows.length, outDir: root, submissions: exported };
}

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

async function main() {
  const argv = process.argv.slice(2);
  const outDir = argument(argv, "--out") ?? "./intake-export";
  const origin = argument(argv, "--origin") ?? process.env.INTAKE_API_ORIGIN ?? DEFAULT_ORIGIN;
  const tokenFile = argument(argv, "--token-file");

  const token = tokenFile
    ? (await readFile(tokenFile, "utf8")).trim()
    : (process.env.INTAKE_ADMIN_TOKEN ?? "").trim();

  if (!token) {
    throw new Error(
      "Set INTAKE_ADMIN_TOKEN, or pass --token-file <path>. The service returns 404 " +
        "for the operator routes until the same token is configured there.",
    );
  }

  const result = await exportSubmissions({
    origin,
    token,
    outDir,
    log: (line) => console.log(line),
  });
  console.log(
    `Exported ${result.count} submission(s) from ${origin} into ${result.outDir}`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
