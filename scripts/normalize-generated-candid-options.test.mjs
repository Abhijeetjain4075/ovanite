import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOptionalCandidValues } from "./normalize-generated-candid-options.mjs";

test("optional string fields preserve an explicitly provided empty string", () => {
  const source = "message: value.message ? candid_some(value.message) : candid_none()";
  const result = normalizeOptionalCandidValues(source);

  assert.equal(result.replacements, 1);
  assert.equal(
    result.content,
    "message: value.message !== undefined ? candid_some(value.message) : candid_none()",
  );
});

test("optional numeric fields preserve the valid zero value", () => {
  const source = "sortOrder: value.sortOrder ? candid_some(value.sortOrder) : candid_none()";
  const result = normalizeOptionalCandidValues(source);

  assert.equal(result.replacements, 1);
  assert.match(result.content, /value\.sortOrder !== undefined/);
});

test("normalizes multiple optional fields but leaves unrelated code intact", () => {
  const source = [
    "name: value.name ? candid_some(value.name) : candid_none(),",
    "sortOrder: value.sortOrder ? candid_some(value.sortOrder) : candid_none(),",
    "required: value.required,",
    "return value === undefined ? candid_none() : candid_some(value);",
  ].join("\n");
  const result = normalizeOptionalCandidValues(source);

  assert.equal(result.replacements, 2);
  assert.match(result.content, /value\.name !== undefined/);
  assert.match(result.content, /value\.sortOrder !== undefined/);
  assert.match(result.content, /required: value\.required/);
  assert.match(result.content, /value === undefined \? candid_none\(\)/);
});

test("normalization is idempotent", () => {
  const input = [
    "link: value.link ? candid_some(value.link) : candid_none(),",
    "imageUrl: value.imageUrl !== undefined ? candid_some(value.imageUrl) : candid_none(),",
  ].join("\n");
  const once = normalizeOptionalCandidValues(input);
  const twice = normalizeOptionalCandidValues(once.content);

  assert.equal(once.replacements, 1);
  assert.equal(twice.replacements, 0);
  assert.equal(twice.content, once.content);
});
