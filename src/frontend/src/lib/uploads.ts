/**
 * Attachment policy mirrored from `services/intake/src/files.js`.
 *
 * The service is the authority — it re-checks everything and inspects the bytes
 * — but a visitor should learn that a file is too large or the wrong kind before
 * a 25 MB upload starts. Keep the two lists in step; the service rejects
 * anything it does not recognise regardless of what this file allows.
 */

export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

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

const BINARY_EXTENSIONS = [
  ".7z",
  ".docx",
  ".gz",
  ".pdf",
  ".pptx",
  ".rar",
  ".tar.gz",
  ".tgz",
  ".xlsx",
  ".zip",
];

export const ALLOWED_EXTENSIONS = [
  ...new Set([...TEXT_EXTENSIONS, ...BINARY_EXTENSIONS]),
].sort();

/** Value for the file input's `accept` attribute. */
export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.join(",");

export function extensionOf(name: string): string {
  const lower = name.trim().toLowerCase();
  if (lower.endsWith(".tar.gz")) return ".tar.gz";
  const dot = lower.lastIndexOf(".");
  if (dot <= 0 || dot === lower.length - 1) return "";
  return lower.slice(dot);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Problem with one file, or `undefined` when it looks acceptable. */
export function validateAttachment(
  name: string,
  size: number,
): string | undefined {
  if (size <= 0) return "That file is empty.";
  if (size > MAX_FILE_BYTES) return "Each file must be 20 MB or smaller.";
  const extension = extensionOf(name);
  if (!extension) {
    return "Every file needs a recognised extension, such as .zip, .tar.gz or .ts.";
  }
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `${extension} files are not accepted. Send a zip, a tarball, a PDF or a source file.`;
  }
  return undefined;
}

/**
 * Problem with the whole selection, or `undefined`. Called after merging a new
 * pick into the current list so the visitor sees one clear message.
 */
export function validateAttachmentSet(
  files: { name: string; size: number }[],
): string | undefined {
  if (files.length > MAX_FILES) return `Attach at most ${MAX_FILES} files.`;
  let total = 0;
  for (const file of files) {
    const problem = validateAttachment(file.name, file.size);
    if (problem) return problem;
    total += file.size;
  }
  if (total > MAX_TOTAL_BYTES) return "Attachments must total 25 MB or less.";
  return undefined;
}
