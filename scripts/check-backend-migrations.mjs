#!/usr/bin/env node
/**
 * Backend migration invariant gate.
 *
 * `main` deliberately consolidated the product-image and authorization work
 * into a single pending migration, `20261029_150000.mo`, and the Motoko
 * stable-state check runs with `check-limit = 1`. A branch that still carries
 * `20261029_100000.mo` therefore cannot be merged without turning the gate red.
 *
 * Run this in CI so that invariant is enforced by tooling instead of review
 * memory. It reads filenames only; it does not modify the tree.
 */
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const MIGRATIONS_DIR = "src/backend/migrations";
const FORBIDDEN = ["20261029_100000.mo"];
const BASELINE_PREFIX = "20260918_140000";
const MAX_PENDING = 1;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, MIGRATIONS_DIR);

const entries = (await readdir(directory))
  .filter(name => name.endsWith(".mo"))
  .sort();

const failures = [];

for (const forbidden of FORBIDDEN) {
  if (entries.includes(forbidden)) {
    failures.push(
      `Forbidden migration ${forbidden} is present. It was consolidated into 20261029_150000.mo; reintroducing it exceeds check-limit=1.`,
    );
  }
}

const pending = entries.filter(name => name.slice(0, 15) > BASELINE_PREFIX);
if (pending.length !== MAX_PENDING) {
  failures.push(
    `Expected exactly ${MAX_PENDING} pending migration after ${BASELINE_PREFIX}, found ${pending.length}: ${pending.join(", ") || "(none)"}.`,
  );
}

if (entries.length === 0) {
  failures.push(`No migrations found in ${MIGRATIONS_DIR}.`);
}

if (failures.length > 0) {
  console.error("Backend migration invariant check failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Migration invariants OK (${entries.length} migrations, ${pending.length} pending: ${pending[0]}).`);
