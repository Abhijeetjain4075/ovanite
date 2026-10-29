import { readFile } from "node:fs/promises";

const files = {
  candid: "src/backend/dist/backend.did",
  declarations: "src/frontend/src/declarations/backend.did.d.ts",
  idl: "src/frontend/src/declarations/backend.did.js",
  wrapper: "src/frontend/src/backend.ts",
};

async function readRequiredFile(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    throw new Error(`Required generated backend contract file is missing: ${path}`, {
      cause: error,
    });
  }
}

function collectMatches(source, pattern, label) {
  const matches = [...source.matchAll(pattern)].map((match) => ({
    name: match[1],
    index: match.index,
  }));
  if (matches.length === 0) {
    throw new Error(`Could not discover any ${label}; generated contract format may have changed.`);
  }
  const names = matches.map(({ name }) => name);
  if (new Set(names).size !== names.length) {
    throw new Error(`Duplicate ${label} were found: ${names.join(", ")}`);
  }
  return matches;
}

function compareNames(expected, actual, label) {
  const expectedNames = [...expected].sort();
  const actualNames = [...actual].sort();
  const missing = expectedNames.filter((name) => !actualNames.includes(name));
  const extra = actualNames.filter((name) => !expectedNames.includes(name));
  if (missing.length || extra.length) {
    throw new Error(
      [
        `${label} do not match.`,
        missing.length ? `Missing: ${missing.join(", ")}` : "",
        extra.length ? `Unexpected: ${extra.join(", ")}` : "",
      ].filter(Boolean).join("\n"),
    );
  }
}

function serviceRecords(source, startIndex, pattern, label, isQuery) {
  const region = source.slice(startIndex);
  const matches = collectMatches(region, pattern, label);
  return matches.map((match, index) => {
    const nextIndex = matches[index + 1]?.index ?? region.length;
    const declaration = region.slice(match.index, nextIndex);
    return {
      name: match.name,
      mode: isQuery ? (isQuery(declaration) ? "query" : "update") : undefined,
    };
  });
}

const [candid, declarations, idl, wrapper] = await Promise.all(
  Object.values(files).map(readRequiredFile),
);

const candidServiceStart = candid.indexOf("service : {");
if (candidServiceStart < 0) {
  throw new Error(`${files.candid} does not contain the expected Candid service declaration.`);
}
const candidMethods = serviceRecords(
  candid,
  candidServiceStart,
  /^  (_?[A-Za-z][A-Za-z0-9_]*)\\s*:\\s*\\(/gm,
  "Candid service methods",
  (declaration) => /\\)\\s*query\\s*;/.test(declaration),
);

const serviceTypeStart = declarations.indexOf("export interface _SERVICE {");
if (serviceTypeStart < 0) {
  throw new Error(`${files.declarations} does not export the generated _SERVICE interface.`);
}
const serviceTypeEnd = declarations.indexOf("\\n}", serviceTypeStart);
if (serviceTypeEnd < 0) {
  throw new Error(`Could not find the end of the _SERVICE interface in ${files.declarations}.`);
}
const typedMethods = collectMatches(
  declarations.slice(serviceTypeStart, serviceTypeEnd),
  /^  '(_?[A-Za-z][A-Za-z0-9_]*)'\\s*:\\s*ActorMethod</gm,
  "generated ActorMethod declarations",
).map(({ name }) => name);

const idlServiceStart = idl.indexOf("return IDL.Service({");
if (idlServiceStart < 0) {
  throw new Error(`${files.idl} does not contain the expected IDL.Service declaration.`);
}
const idlMethods = serviceRecords(
  idl,
  idlServiceStart,
  /^    '(_?[A-Za-z][A-Za-z0-9_]*)'\\s*:\\s*IDL\\.Func\\(/gm,
  "generated IDL service methods",
  (declaration) => /\\[\\s*['"]query['"]\\s*\\]/.test(declaration),
);

const wrapperStart = wrapper.indexOf("export class Backend implements backendInterface {");
const wrapperEnd = wrapper.indexOf("export interface CreateActorOptions", wrapperStart);
if (wrapperStart < 0 || wrapperEnd < 0) {
  throw new Error(`${files.wrapper} does not contain the expected generated Backend wrapper.`);
}
const wrapperMethods = collectMatches(
  wrapper.slice(wrapperStart, wrapperEnd),
  /^ {4}async ([A-Za-z][A-Za-z0-9_]*)\\s*\\(/gm,
  "public Backend wrapper methods",
).map(({ name }) => name);

const allCandidNames = candidMethods.map(({ name }) => name);
const publicCandidMethods = candidMethods.filter(({ name }) => !name.startsWith("_"));
const idlNames = idlMethods.map(({ name }) => name);
compareNames(allCandidNames, typedMethods, "Candid and generated _SERVICE method names");
compareNames(allCandidNames, idlNames, "Candid and generated IDL method names");
compareNames(
  publicCandidMethods.map(({ name }) => name),
  wrapperMethods,
  "Public Candid and generated Backend wrapper method names",
);

const idlModeByName = new Map(idlMethods.map(({ name, mode }) => [name, mode]));
const modeMismatches = candidMethods.filter(({ name, mode }) => idlModeByName.get(name) !== mode);
if (modeMismatches.length) {
  throw new Error(
    "Candid query/update modes differ from generated IDL for: " +
      modeMismatches.map(({ name, mode }) => `${name} (Candid=${mode}, IDL=${idlModeByName.get(name)})`).join(", "),
  );
}

console.log(
  `Backend contract parity passed: ${allCandidNames.length} Candid methods (${publicCandidMethods.length} public API methods), generated _SERVICE and IDL names/modes aligned, ${wrapperMethods.length} frontend wrapper methods aligned.`,
);
