/**
 * Attachment policy for the intake service.
 *
 * Visitors send code and product bundles — a zip of a repository, a tarball, a
 * single source file. The service never unpacks, executes or serves them
 * inline: it validates the declared extension, checks the bytes match that
 * extension, stores the object under a random key in R2 and keeps the original
 * name only as metadata. Everything here is pure so the policy is unit-testable
 * without a bucket.
 */

export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
/** Form framing (boundaries, field names) on top of the payload itself. */
export const MULTIPART_OVERHEAD_BYTES = 512 * 1024;

const TEXT_EXTENSIONS = [
  ".c",
  ".cc",
  ".cfg",
  ".clj",
  ".cpp",
  ".cs",
  ".css",
  ".csv",
  ".dart",
  ".ex",
  ".exs",
  ".go",
  ".gradle",
  ".graphql",
  ".h",
  ".hpp",
  ".htm",
  ".html",
  ".ini",
  ".java",
  ".js",
  ".json",
  ".jsonl",
  ".jsx",
  ".kt",
  ".kts",
  ".less",
  ".lua",
  ".m",
  ".md",
  ".mjs",
  ".mm",
  ".php",
  ".pl",
  ".proto",
  ".ps1",
  ".py",
  ".r",
  ".rb",
  ".rs",
  ".scala",
  ".scss",
  ".sh",
  ".sol",
  ".sql",
  ".svelte",
  ".swift",
  ".tf",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".vue",
  ".xml",
  ".yaml",
  ".yml",
];

/**
 * Binary formats carry a fixed header, so a renamed text file cannot pass as an
 * archive. Office documents are zip containers, which is why they share the zip
 * signature.
 */
const BINARY_SIGNATURES = new Map([
  [".7z", [[0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]]],
  [".docx", [[0x50, 0x4b, 0x03, 0x04]]],
  [".gz", [[0x1f, 0x8b]]],
  [".tgz", [[0x1f, 0x8b]]],
  [".pdf", [[0x25, 0x50, 0x44, 0x46]]],
  [".pptx", [[0x50, 0x4b, 0x03, 0x04]]],
  [".rar", [[0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]]],
  [
    ".tar.gz",
    [
      [0x1f, 0x8b],
    ],
  ],
  [
    ".xlsx",
    [[0x50, 0x4b, 0x03, 0x04]],
  ],
  [
    ".zip",
    [
      [0x50, 0x4b, 0x03, 0x04],
      [0x50, 0x4b, 0x05, 0x06],
      [0x50, 0x4b, 0x07, 0x08],
    ],
  ],
]);

const CONTENT_TYPES = new Map([
  [".7z", "application/x-7z-compressed"],
  [".csv", "text/csv"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".gz", "application/gzip"],
  [".json", "application/json"],
  [".md", "text/markdown"],
  [".pdf", "application/pdf"],
  [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  [".rar", "application/vnd.rar"],
  [".tar.gz", "application/gzip"],
  [".tgz", "application/gzip"],
  [".txt", "text/plain"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".zip", "application/zip"],
]);

/** Longest-suffix first so `.tar.gz` never degrades to `.gz`. */
const MULTI_PART_EXTENSIONS = [".tar.gz"];

export const ALLOWED_EXTENSIONS = [
  ...new Set([...TEXT_EXTENSIONS, ...BINARY_SIGNATURES.keys()]),
].sort();

/** Value for the `accept` attribute of a file input. */
export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.join(",");

export const EXTENSION_LABELS = {
  ".zip": "zip archive",
  ".tar.gz": "gzipped tarball",
  ".tgz": "gzipped tarball",
  ".gz": "gzip archive",
  ".7z": "7z archive",
  ".rar": "rar archive",
  ".pdf": "PDF",
};

export function extensionOf(name) {
  const lower = typeof name === "string" ? name.trim().toLowerCase() : "";
  for (const extension of MULTI_PART_EXTENSIONS) {
    if (lower.endsWith(extension)) return extension;
  }
  const dot = lower.lastIndexOf(".");
  if (dot <= 0 || dot === lower.length - 1) return "";
  return lower.slice(dot);
}

export function isAllowedExtension(extension) {
  return ALLOWED_EXTENSIONS.includes(extension);
}

/**
 * Keeps the name as metadata only: no directory components, no control
 * characters, no path traversal (the object key is generated independently).
 */
export function sanitizeFileName(name) {
  const raw = typeof name === "string" ? name : "";
  const base = raw.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the point
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "attachment";
  return cleaned.length > 120 ? cleaned.slice(cleaned.length - 120) : cleaned;
}

export function contentTypeFor(extension) {
  return CONTENT_TYPES.get(extension) ?? "application/octet-stream";
}

/**
 * Field-level problem for one file, or `null` when it is acceptable.
 * `size` is the byte length the browser declared.
 */
export function validateAttachment(name, size) {
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return "That file is empty.";
  }
  if (size > MAX_FILE_BYTES) {
    return "Each file must be 20 MB or smaller.";
  }
  const extension = extensionOf(name);
  if (!extension) {
    return "Every file needs a recognised extension, such as .zip, .tar.gz or .ts.";
  }
  if (!isAllowedExtension(extension)) {
    return `Files of type ${extension} are not accepted. Send a zip, a tarball, a PDF or a source file.`;
  }
  return null;
}

function startsWith(bytes, signature) {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

function looksBinary(bytes) {
  const window = bytes.subarray(0, Math.min(bytes.length, 8192));
  for (const byte of window) {
    if (byte === 0) return true;
  }
  return false;
}

/**
 * Confirms the bytes match the extension: archives and PDFs must carry their
 * signature, text-like files must not contain NUL bytes. The service never
 * inspects further — it does not decompress, so a zip bomb has no effect here.
 */
export function inspectAttachment(name, bytes) {
  if (!(bytes instanceof Uint8Array)) return "That file could not be read.";
  if (bytes.length === 0) return "That file is empty.";
  if (bytes.length > MAX_FILE_BYTES) return "Each file must be 20 MB or smaller.";

  const extension = extensionOf(name);
  const signatures = BINARY_SIGNATURES.get(extension);
  if (signatures) {
    const matches = signatures.some((signature) => startsWith(bytes, signature));
    if (!matches) {
      return `That file does not look like a ${EXTENSION_LABELS[extension] ?? extension} file.`;
    }
    return null;
  }

  if (!TEXT_EXTENSIONS.includes(extension)) {
    return "Files of that type are not accepted.";
  }
  if (looksBinary(bytes)) {
    return "That file contains binary data, so it is not treated as a source file. Send it as a zip or tarball.";
  }
  return null;
}

/** `intake/2026/11/<uuid>.zip` — the visitor never influences the key. */
export function objectKeyFor(extension, now = Date.now()) {
  const date = new Date(now);
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `intake/${year}/${month}/${crypto.randomUUID()}${extension}`;
}
