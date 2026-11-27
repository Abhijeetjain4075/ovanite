#!/usr/bin/env node
/**
 * Reads what users submitted: lists records, downloads them with their
 * attachments, extracts archives and packages a submission to hand to a reviewer.
 *
 * The intake service keeps records in D1 and files in R2 and exposes them only
 * through its token-protected operator routes. This script is the operator side
 * of that contract: it needs `INTAKE_ADMIN_TOKEN` and nothing else, and never
 * prints the token.
 *
 * Extraction is deliberately conservative (see `archive.mjs`): an entry may not
 * escape its folder, links are refused, and size and count are capped. A file
 * that cannot be extracted is reported next to the untouched original instead of
 * failing the whole export.
 *
 * Everything is written mode 0600 inside 0700 folders because submissions are
 * personal data; `intake-export/` is ignored by git and must never be served.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_LIMITS, createZip, extractArchive } from "./archive.mjs";

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

/**
 * Folders whose contents are published or version-controlled.
 *
 * Writing submissions there would put personal data on the web or into git, so
 * the tool refuses rather than trusting the operator to notice.
 */
const FORBIDDEN_OUTPUT_SEGMENTS = new Set([
  ".git",
  "node_modules",
  "public",
  "dist",
  "build",
  "out",
]);

export function assertSafeOutputDir(path) {
  const segments = resolve(path).split(sep).filter(Boolean);
  const offending = segments.find((segment) =>
    FORBIDDEN_OUTPUT_SEGMENTS.has(segment),
  );
  if (offending) {
    throw new Error(
      `Refusing to write submissions into "${path}": "${offending}" is a published or generated folder. ` +
        "Choose a folder outside the site's public assets and the repository's build output.",
    );
  }
}

function requireToken(token) {
  if (typeof token !== "string" || token.length < MIN_TOKEN_LENGTH) {
    throw new Error(
      `An operator token of at least ${MIN_TOKEN_LENGTH} characters is required.`,
    );
  }
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

/** The stored records, newest first, without any attachment content. */
export async function listSubmissions({
  origin = DEFAULT_ORIGIN,
  token,
  fetcher = fetch,
  limit = 200,
} = {}) {
  requireToken(token);
  const base = new URL(origin).origin;
  const listing = await readJson(
    await fetcher(
      `${base}/api/intake?limit=${encodeURIComponent(String(limit))}`,
      {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    ),
    "the submission list",
  );
  return Array.isArray(listing?.rows) ? listing.rows : [];
}

async function writePrivateFile(path, data) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, data, { mode: 0o600 });
}

/**
 * Downloads every stored submission, optionally extracting archives and building
 * a share bundle per submission.
 *
 * Returns `{ count, outDir, submissions }` where each submission carries the
 * stored row, the relative path of every attachment and, when asked for, the
 * extraction result and bundle path.
 */
export async function exportSubmissions({
  origin = DEFAULT_ORIGIN,
  token,
  outDir,
  fetcher = fetch,
  limit = 200,
  extract = false,
  bundle = false,
  limits = DEFAULT_LIMITS,
  log = () => {},
} = {}) {
  requireToken(token);
  if (!outDir) throw new Error("An output directory is required.");
  assertSafeOutputDir(outDir);

  const base = new URL(origin).origin;
  const authorization = { authorization: `Bearer ${token}` };
  const rows = await listSubmissions({ origin: base, token, fetcher, limit });

  const root = resolve(outDir);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const submissionsPath = join(root, "submissions.json");
  await writePrivateFile(
    submissionsPath,
    `${JSON.stringify(rows, null, 2)}\n`,
  );
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
    const downloaded = [];
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
      const bytes = new Uint8Array(await response.arrayBuffer());
      const name = safeFileName(file.name);
      const relative = join("attachments", reference, name);
      await writePrivateFile(join(root, relative), bytes);
      const saved = { name: file.name, size: file.size, path: relative };
      downloaded.push({ name, bytes });

      if (extract) {
        try {
          const result = extractArchive(file.name, bytes, limits);
          if (result.entries.length > 0) {
            const folder = join(
              "attachments",
              reference,
              "extracted",
              name,
            );
            for (const entry of result.entries) {
              await writePrivateFile(join(root, folder, entry.path), entry.data);
            }
            saved.extracted = {
              format: result.format,
              files: result.entries.length,
              path: folder,
            };
          } else {
            saved.extracted = { format: result.format, files: 0, path: null };
          }
        } catch (error) {
          saved.extractionError =
            error instanceof Error ? error.message : String(error);
          log(`  ! ${file.name}: ${saved.extractionError}`);
        }
      }

      written.push(saved);
    }

    let bundlePath = null;
    if (bundle) {
      const archive = createZip([
        {
          path: "submission.json",
          data: Buffer.from(`${JSON.stringify(row, null, 2)}\n`),
        },
        ...downloaded.map((file) => ({
          path: `attachments/${file.name}`,
          data: file.bytes,
        })),
      ]);
      bundlePath = join("share", `${reference}.zip`);
      await writePrivateFile(join(root, bundlePath), archive);
    }

    exported.push({
      id: reference,
      kind: row.kind,
      createdAt: row.created_at ?? row.createdAt ?? null,
      name: row.name,
      email: row.email,
      project: row.project ?? null,
      attachments: written,
      ...(bundlePath ? { bundle: bundlePath } : {}),
    });
    log(
      `  ${reference}  ${row.kind ?? "?"}  ${written.length} attachment(s)` +
        (bundlePath ? `  → ${bundlePath}` : ""),
    );
  }

  return { count: rows.length, outDir: root, submissions: exported };
}

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

function printTable(rows) {
  if (rows.length === 0) {
    console.log("No submissions are stored.");
    return;
  }
  const cell = (value, width) =>
    String(value ?? "").replace(/\s+/g, " ").slice(0, width);
  console.log(
    [
      cell("reference", 36),
      cell("received (UTC)", 20),
      cell("kind", 11),
      cell("name", 20),
      cell("email", 28),
      cell("project", 24),
    ].join("  "),
  );
  for (const row of rows) {
    console.log(
      [
        cell(row.id, 36),
        cell(row.created_at ?? row.createdAt, 20),
        cell(row.kind, 11),
        cell(row.name, 20),
        cell(row.email, 28),
        cell(row.project, 24),
      ].join("  "),
    );
  }
  console.log(`\n${rows.length} submission(s).`);
}

async function main() {
  const argv = process.argv.slice(2);
  const outDir = argument(argv, "--out") ?? "./intake-export";
  const origin =
    argument(argv, "--origin") ?? process.env.INTAKE_API_ORIGIN ?? DEFAULT_ORIGIN;
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

  if (argv.includes("--list")) {
    printTable(await listSubmissions({ origin, token }));
    return;
  }

  const result = await exportSubmissions({
    origin,
    token,
    outDir,
    extract: argv.includes("--extract"),
    bundle: argv.includes("--bundle"),
    log: (line) => console.log(line),
  });
  console.log(
    `Exported ${result.count} submission(s) from ${origin} into ${result.outDir}`,
  );
  if (argv.includes("--extract")) {
    const failed = result.submissions.flatMap((submission) =>
      submission.attachments.filter((file) => file.extractionError),
    );
    console.log(
      failed.length === 0
        ? "Every archive was extracted."
        : `${failed.length} archive(s) could not be extracted; the originals are intact.`,
    );
  }
  if (argv.includes("--bundle")) {
    console.log(
      `Share bundles: ${join(result.outDir, "share")} (one zip per submission).`,
    );
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
