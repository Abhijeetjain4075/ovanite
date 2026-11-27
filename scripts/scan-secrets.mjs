#!/usr/bin/env node
/**
 * Release gate: refuse a repository that would publish a secret or personal data.
 *
 * The remote for this project is publicly readable, so anything committed is
 * world-readable forever. This check covers the three ways material leaks:
 *
 *   1. a forbidden path is tracked now or was tracked at any point
 *      (`.secrets/`, an export folder, `.env`, a key file);
 *   2. a known secret value appears in the worktree, in any commit on any ref,
 *      or in any path that was ever tracked;
 *   3. a credential-shaped string is committed, even if nobody told this script
 *      its value.
 *
 * Only labels, paths and commit ids are printed — never the matched text — so
 * running the gate cannot itself leak the thing it is protecting.
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Paths that must never be tracked. `.env.example`-style templates stay allowed
 * because they document the contract without holding a value.
 */
export const FORBIDDEN_PATH_PATTERNS = [
  { label: "secret-directory", pattern: /(^|\/)\.secrets(\/|$)/ },
  { label: "export-directory", pattern: /(^|\/)intake-export(\/|$)/ },
  { label: "dev-vars", pattern: /(^|\/)\.dev\.vars(\.|$)/ },
  { label: "dotenv", pattern: /(^|\/)\.env$/ },
  { label: "dotenv-value", pattern: /(^|\/)\.env\.(?!example$|sample$|template$)/ },
  { label: "credential-file", pattern: /(^|\/)credentials\.json$/ },
  { label: "service-account", pattern: /(^|\/)service-account[^/]*\.json$/ },
  { label: "private-key", pattern: /(^|\/)id_(rsa|ed25519)[^/]*$/ },
  { label: "key-file", pattern: /\.(pem|key|p12|pfx)$/ },
];

/** Credential shapes worth failing on even when their value is unknown. */
export const CREDENTIAL_PATTERNS = [
  { label: "private-key-block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { label: "github-token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}/ },
  { label: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "openai-key", pattern: /\bsk-[A-Za-z0-9]{24,}/ },
  { label: "slack-token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { label: "r2-endpoint", pattern: /r2\.cloudflarestorage\.com/ },
  { label: "bearer-literal", pattern: /Bearer\s+[A-Za-z0-9._-]{24,}/ },
  { label: "jwt", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./ },
];

export function isForbiddenPath(path) {
  return (
    FORBIDDEN_PATH_PATTERNS.find(({ pattern }) => pattern.test(path))?.label ??
    null
  );
}

export function findCredentialShapes(text) {
  if (typeof text !== "string" || text.length === 0) return [];
  return CREDENTIAL_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ label }) => label,
  );
}

function git(cwd, args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (error) {
    if (allowFailure) return "";
    throw error;
  }
}

/**
 * Scans a repository. Returns `{ findings, scanned }`; an empty `findings`
 * array means the release is safe to publish as far as this check can tell.
 */
export function scanRepository({ cwd = process.cwd(), needles = [] } = {}) {
  const findings = [];
  const scanned = { trackedPaths: 0, historicalPaths: 0, needles: 0 };

  const tracked = git(cwd, ["ls-files", "-z"])
    .split("\0")
    .filter(Boolean);
  scanned.trackedPaths = tracked.length;
  for (const path of tracked) {
    const label = isForbiddenPath(path);
    if (label) findings.push({ kind: "tracked-path", label, path });
  }

  // Every path ever reachable from any ref, so a file that was committed and
  // later deleted is still reported.
  const historical = git(cwd, ["rev-list", "--objects", "--all"])
    .split("\n")
    .map((line) => line.slice(line.indexOf(" ") + 1))
    .filter((path) => path.length > 0);
  scanned.historicalPaths = historical.length;
  for (const path of historical) {
    const label = isForbiddenPath(path);
    if (label) findings.push({ kind: "historical-path", label, path });
  }

  // Credential shapes in the published tree. `git grep` reports locations only.
  for (const { label, pattern } of CREDENTIAL_PATTERNS) {
    const output = git(cwd, ["grep", "-I", "-l", "-E", pattern.source], {
      allowFailure: true,
    });
    for (const path of output.split("\n").filter(Boolean)) {
      findings.push({ kind: "credential-shape", label, path });
    }
  }

  // Known values: content anywhere in history, so a value that was committed and
  // removed is still caught.
  // A value shorter than this matches too much to be a useful signal; the
  // caller decides what to search for, so this is only a noise floor.
  for (const needle of needles.filter((value) => value && value.length >= 6)) {
    scanned.needles += 1;
    const commits = git(
      cwd,
      ["log", "--all", "--oneline", `-S${needle}`, "--"],
      { allowFailure: true },
    )
      .split("\n")
      .filter(Boolean);
    for (const commit of commits) {
      findings.push({
        kind: "known-value",
        label: "committed-secret",
        commit: commit.split(" ")[0],
        path: "-",
      });
    }
  }

  return { findings, scanned };
}

function arguments_(argv) {
  const needles = [];
  let needlesFile;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--needle") {
      needles.push(argv[index + 1]);
      index += 1;
    } else if (argv[index] === "--needles-file") {
      needlesFile = argv[index + 1];
      index += 1;
    }
  }
  return { needles, needlesFile };
}

async function main() {
  const { needles, needlesFile } = arguments_(process.argv.slice(2));
  if (needlesFile) {
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(needlesFile, "utf8");
    needles.push(...content.split("\n").map((line) => line.trim()));
  }

  const { findings, scanned } = scanRepository({ needles });
  console.log(
    `Scanned ${scanned.trackedPaths} tracked paths, ${scanned.historicalPaths} historical paths and ${scanned.needles} known value(s).`,
  );

  if (findings.length === 0) {
    console.log("No secret or forbidden path found. Safe to publish.");
    return;
  }

  console.error(`Found ${findings.length} finding(s):`);
  for (const finding of findings) {
    console.error(
      `  ${finding.kind} ${finding.label} ${finding.commit ?? finding.path}`,
    );
  }
  console.error("Nothing was printed verbatim: fix the source, then re-run.");
  process.exitCode = 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
