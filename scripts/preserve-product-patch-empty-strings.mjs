import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const backendWrapperPath = "src/frontend/src/backend.ts";

const productPatchSignature = [
  "    sortOrder?: bigint;",
  "    link?: string;",
  "    name?: string;",
  "    description?: string;",
  "    imageKey?: ExternalBlob;",
  "    imageUrl?: string;",
  "}): Promise<{",
].join("\n");

function countOccurrences(source, needle) {
  let count = 0;
  let offset = 0;
  while ((offset = source.indexOf(needle, offset)) !== -1) {
    count += 1;
    offset += needle.length;
  }
  return count;
}

function preserveOptionalString(block, field) {
  const raw = field + ": value." + field + " ? candid_some(value." + field +
    ") : candid_none()";
  const preserved = field + ": value." + field +
    " !== undefined ? candid_some(value." + field + ") : candid_none()";
  const rawCount = countOccurrences(block, raw);
  const preservedCount = countOccurrences(block, preserved);

  if (rawCount === 1 && preservedCount === 0) {
    return block.replace(raw, preserved);
  }
  if (rawCount === 0 && preservedCount === 1) {
    return block;
  }
  throw new Error(
    "Expected exactly one generated optional " + field +
      " conversion in ProductPatch; found truthy=" + rawCount +
      ", presence-preserving=" + preservedCount +
      ". Refusing to make an ambiguous generated-code edit.",
  );
}

/**
 * The pinned Caffeine generator treats an empty optional text as absent. For
 * ProductPatch, an empty string is intentionally different from undefined:
 * the Motoko backend uses an explicit empty string to clear existing links and
 * image URLs, while an absent option means "leave unchanged". Restore that
 * contract only in the uniquely identified ProductPatch converter.
 */
export function preserveProductPatchEmptyStringSemantics(source) {
  const signatureIndex = source.indexOf(productPatchSignature);
  if (
    signatureIndex < 0 ||
    source.indexOf(productPatchSignature, signatureIndex + 1) !== -1
  ) {
    throw new Error(
      "Could not uniquely identify the generated ProductPatch converter. " +
        "The binding generator output changed; inspect it before updating this adapter.",
    );
  }

  const functionStart = source.lastIndexOf("async function ", signatureIndex);
  if (functionStart < 0) {
    throw new Error("Could not locate the generated ProductPatch converter function.");
  }

  const functionHeader = source.slice(functionStart, signatureIndex);
  if (!/^async function to_candid_record_n\d+\(/.test(functionHeader)) {
    throw new Error(
      "ProductPatch signature is no longer inside the expected generated record converter.",
    );
  }

  const functionEnd = source.indexOf("\n}\nfunction ", signatureIndex);
  if (functionEnd < 0) {
    throw new Error("Could not locate the end of the generated ProductPatch converter.");
  }

  const functionBlock = source.slice(functionStart, functionEnd + 2);
  let patchedBlock = preserveOptionalString(functionBlock, "link");
  patchedBlock = preserveOptionalString(patchedBlock, "imageUrl");

  return source.slice(0, functionStart) +
    patchedBlock +
    source.slice(functionEnd + 2);
}

async function main() {
  const source = await readFile(backendWrapperPath, "utf8");
  const patched = preserveProductPatchEmptyStringSemantics(source);
  if (patched !== source) {
    await writeFile(backendWrapperPath, patched, "utf8");
    console.log("Preserved explicit empty-string clearing in the generated ProductPatch binding.");
  } else {
    console.log("Generated ProductPatch binding already preserves explicit empty-string clearing.");
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
