#!/usr/bin/env node
/**
 * Branch consolidation audit.
 *
 * For every `origin/*` branch except `main`, answer two questions with evidence
 * rather than intuition:
 *
 *   1. Would merging it change the tree at all? (`git merge-tree` against HEAD;
 *      an identical tree means the branch is fully contained.)
 *   2. How much of its unique work already exists in HEAD? Every added line that
 *      survives a length and import filter is looked up in the current file, so a
 *      change that main rewrote into a different shape still counts as present.
 *
 * Output: one line per branch — ratio, contained lines, merge outcome, name.
 * A branch at ratio 1.00 or `noop` holds nothing that HEAD does not already
 * have; anything lower needs a human read of the misses before it is removed.
 *
 * Usage: node scripts/audit-branches.mjs [--from <ref>]
 */
import { execFileSync } from "node:child_process";

const git = (args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });

const fromIndex = process.argv.indexOf("--from");
const from = fromIndex > -1 ? process.argv[fromIndex + 1] : "HEAD";

function show(ref, path) {
  try {
    return git(["show", `${ref}:${path}`]);
  } catch {
    return null;
  }
}

/** Added lines in `base..branch`, keyed by path, filtered to meaningful ones. */
function addedLinesByPath(base, branch) {
  const diff = git(["diff", "--unified=0", base, branch]);
  const byPath = new Map();
  let path = null;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      path = line.slice(6);
      if (!byPath.has(path)) byPath.set(path, new Set());
      continue;
    }
    if (!path || !line.startsWith("+") || line.startsWith("+++")) continue;
    const text = line.slice(1).trim();
    if (text.length < 24) continue;
    if (/^(import|from|const \w+ = require)/.test(text)) continue;
    byPath.get(path).add(text);
  }
  return byPath;
}

function audit(branch) {
  const base = git(["merge-base", from, branch]).trim();
  const byPath = addedLinesByPath(base, branch);

  let total = 0;
  let present = 0;
  const missing = [];
  for (const [path, lines] of byPath) {
    if (lines.size === 0) continue;
    const current = show(from, path);
    const currentLines = new Set(
      (current ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    );
    for (const line of lines) {
      total += 1;
      if (currentLines.has(line)) present += 1;
      else missing.push(`${path}: ${line.slice(0, 120)}`);
    }
  }

  let merge = "clean";
  try {
    const tree = git(["merge-tree", "--write-tree", from, branch]).split("\n")[0];
    const headTree = git(["rev-parse", `${from}^{tree}`]).trim();
    merge = tree === headTree ? "noop" : "changes";
  } catch {
    merge = "conflict";
  }

  return {
    branch: branch.replace("origin/", ""),
    ratio: total === 0 ? 1 : present / total,
    present,
    total,
    merge,
    missing,
  };
}

const branches = git(["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin"])
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && line !== "origin/HEAD" && line !== "origin/main");

const rows = branches.map(audit).sort((a, b) => a.ratio - b.ratio);

for (const row of rows) {
  console.log(
    `${row.ratio.toFixed(2)}  ${String(row.present).padStart(4)}/${String(row.total).padEnd(4)} ${row.merge.padEnd(8)} ${row.branch}`,
  );
}

const contained = rows.filter((row) => row.ratio === 1 || row.merge === "noop");
const review = rows.filter((row) => !contained.includes(row));

console.log(
  `\n${contained.length} of ${rows.length} branches hold nothing HEAD lacks.`,
);
if (review.length > 0) {
  console.log(`${review.length} need a human read:`);
  for (const row of review) {
    console.log(`\n--- ${row.branch} (${row.present}/${row.total} lines present, merge ${row.merge})`);
    for (const line of row.missing.slice(0, 10)) console.log(`    ${line}`);
    if (row.missing.length > 10) console.log(`    … ${row.missing.length - 10} more`);
  }
}
