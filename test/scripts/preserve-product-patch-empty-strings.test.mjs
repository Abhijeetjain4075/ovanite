import assert from "node:assert/strict";
import test from "node:test";

import { preserveProductPatchEmptyStringSemantics } from "../../scripts/preserve-product-patch-empty-strings.mjs";

function generatedWrapper() {
  return [
    "async function to_candid_record_n76(upload, download, value: {",
    "    sortOrder?: bigint;",
    "    link?: string;",
    "    name?: string;",
    "    description?: string;",
    "    imageKey?: ExternalBlob;",
    "    imageUrl?: string;",
    "}): Promise<{",
    "    link: [] | [string];",
    "    imageUrl: [] | [string];",
    "}> {",
    "    return {",
    "        link: value.link ? candid_some(value.link) : candid_none(),",
    "        imageUrl: value.imageUrl ? candid_some(value.imageUrl) : candid_none()",
    "    };",
    "}",
    "function to_other_record(value) {",
    "    return {",
    "        link: value.link ? candid_some(value.link) : candid_none(),",
    "        imageUrl: value.imageUrl ? candid_some(value.imageUrl) : candid_none()",
    "    };",
    "}",
    "",
  ].join("\n");
}

test("ProductPatch preserves explicit empty strings for clearing both URLs", () => {
  const result = preserveProductPatchEmptyStringSemantics(generatedWrapper());
  assert.match(
    result,
    /link: value\.link !== undefined \? candid_some\(value\.link\) : candid_none\(\),/,
  );
  assert.match(
    result,
    /imageUrl: value\.imageUrl !== undefined \? candid_some\(value\.imageUrl\) : candid_none\(\)/,
  );

  const otherConverter = result.slice(result.indexOf("function to_other_record"));
  assert.match(otherConverter, /link: value\.link \? candid_some\(value\.link\) : candid_none\(\),/);
  assert.match(otherConverter, /imageUrl: value\.imageUrl \? candid_some\(value\.imageUrl\) : candid_none\(\)/);
});

test("ProductPatch compatibility patch is idempotent", () => {
  const once = preserveProductPatchEmptyStringSemantics(generatedWrapper());
  assert.equal(preserveProductPatchEmptyStringSemantics(once), once);
});

test("fails closed when the expected ProductPatch shape changes", () => {
  assert.throws(
    () => preserveProductPatchEmptyStringSemantics("async function unrelated() {}"),
    /Could not uniquely identify the generated ProductPatch converter/,
  );
});

test("fails closed when only one target conversion is found", () => {
  const source = generatedWrapper().replace(
    "imageUrl: value.imageUrl ? candid_some(value.imageUrl) : candid_none()",
    "imageUrl: value.imageUrl !== undefined ? candid_some(value.imageUrl) : candid_none()",
  ).replace(
    "link: value.link ? candid_some(value.link) : candid_none(),",
    "link: candid_none(),",
  );
  assert.throws(
    () => preserveProductPatchEmptyStringSemantics(source),
    /Expected exactly one generated optional link conversion/,
  );
});
