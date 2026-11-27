/**
 * Reading and packaging operator-owned submission archives.
 *
 * Attachments are stored exactly as the visitor sent them, so "seeing" one means
 * extracting it on the operator's machine. Extraction is therefore treated as an
 * untrusted-input problem: entries may not escape the destination, may not be
 * links, and are bounded in count and size. Everything here is pure and takes
 * bytes, so it is testable without a network or a filesystem.
 *
 * ZIP reading is dependency-free: the central directory is parsed directly and
 * only `store` and `deflate` entries are accepted. A format this tool does not
 * understand is refused rather than guessed at.
 */
import { gunzipSync, inflateRawSync } from "node:zlib";

export const DEFAULT_LIMITS = Object.freeze({
  maxEntries: 2000,
  maxEntryBytes: 64 * 1024 * 1024,
  maxTotalBytes: 256 * 1024 * 1024,
});

const ZIP_LOCAL = 0x04034b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_END = 0x06054b50;

/** One path segment list, or `null` when the name would escape the destination. */
export function safeEntryPath(name) {
  if (typeof name !== "string") return null;
  const normalised = name.replace(/\\/g, "/");
  if (normalised.startsWith("/")) return null;
  if (/^[A-Za-z]:/.test(normalised)) return null;
  const parts = [];
  for (const part of normalised.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") return null;
    parts.push(part);
  }
  if (parts.length === 0) return null;
  return parts.join("/");
}

function assertWithinLimits(entries, limits) {
  if (entries.length > limits.maxEntries) {
    throw new Error(
      `That archive has ${entries.length} files; the limit is ${limits.maxEntries}.`,
    );
  }
  let total = 0;
  for (const entry of entries) {
    if (entry.data.length > limits.maxEntryBytes) {
      throw new Error(`"${entry.path}" is larger than the per-file limit.`);
    }
    total += entry.data.length;
    if (total > limits.maxTotalBytes) {
      throw new Error("The archive is larger than the total extraction limit.");
    }
  }
}

function readUint16(buffer, offset) {
  return buffer.readUInt16LE(offset);
}

function readUint32(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

/** Locates the end-of-central-directory record by scanning backwards. */
function findEndOfCentralDirectory(buffer) {
  const earliest = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= earliest; offset -= 1) {
    if (readUint32(buffer, offset) === ZIP_END) return offset;
  }
  return -1;
}

function isSymlink(externalAttributes) {
  const mode = (externalAttributes >>> 16) & 0xffff;
  return (mode & 0o170000) === 0o120000;
}

export function extractZip(buffer, limits = DEFAULT_LIMITS) {
  const end = findEndOfCentralDirectory(buffer);
  if (end === -1) throw new Error("That file is not a readable zip archive.");

  const count = readUint16(buffer, end + 10);
  const directoryOffset = readUint32(buffer, end + 16);
  if (count > limits.maxEntries) {
    throw new Error(
      `That archive has ${count} files; the limit is ${limits.maxEntries}.`,
    );
  }
  if (directoryOffset >= buffer.length) {
    throw new Error("That zip archive is truncated.");
  }

  const entries = [];
  let cursor = directoryOffset;
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > buffer.length) {
      throw new Error("That zip archive is truncated.");
    }
    if (readUint32(buffer, cursor) !== ZIP_CENTRAL) {
      throw new Error("That zip archive has an unreadable directory.");
    }
    const flags = readUint16(buffer, cursor + 8);
    const method = readUint16(buffer, cursor + 10);
    const compressedSize = readUint32(buffer, cursor + 20);
    const uncompressedSize = readUint32(buffer, cursor + 24);
    const nameLength = readUint16(buffer, cursor + 28);
    const extraLength = readUint16(buffer, cursor + 30);
    const commentLength = readUint16(buffer, cursor + 32);
    const externalAttributes = readUint32(buffer, cursor + 38);
    const localOffset = readUint32(buffer, cursor + 42);
    const rawName = buffer.toString(
      "utf8",
      cursor + 46,
      cursor + 46 + nameLength,
    );
    cursor += 46 + nameLength + extraLength + commentLength;

    if (flags & 0x1) {
      throw new Error("That archive is encrypted; it cannot be opened here.");
    }
    if (rawName.endsWith("/")) continue; // directory entry
    if (isSymlink(externalAttributes)) {
      throw new Error(`"${rawName}" is a link, which is never extracted.`);
    }
    const path = safeEntryPath(rawName);
    if (!path) {
      throw new Error(`"${rawName}" would extract outside the destination.`);
    }
    if (localOffset + 30 > buffer.length) {
      throw new Error("That zip archive is truncated.");
    }
    if (readUint32(buffer, localOffset) !== ZIP_LOCAL) {
      throw new Error("That zip archive has an unreadable entry.");
    }
    const localNameLength = readUint16(buffer, localOffset + 26);
    const localExtraLength = readUint16(buffer, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) {
      throw new Error("That zip archive is truncated.");
    }
    const raw = buffer.subarray(dataStart, dataEnd);
    let data;
    if (method === 0) {
      data = Buffer.from(raw);
    } else if (method === 8) {
      data = inflateRawSync(raw, {
        maxOutputLength: Math.max(uncompressedSize, 1),
      });
    } else {
      throw new Error(
        `"${path}" uses compression method ${method}, which is not supported.`,
      );
    }
    if (uncompressedSize > 0 && data.length !== uncompressedSize) {
      throw new Error(`"${path}" did not extract to its declared size.`);
    }
    entries.push({ path, data });
  }

  assertWithinLimits(entries, limits);
  return entries;
}

function parseOctal(buffer, offset, length) {
  const raw = buffer
    .toString("ascii", offset, offset + length)
    .replace(/\0.*$/, "")
    .trim();
  if (raw === "") return 0;
  const value = Number.parseInt(raw, 8);
  return Number.isFinite(value) ? value : 0;
}

export function extractTar(buffer, limits = DEFAULT_LIMITS) {
  const entries = [];
  let offset = 0;
  let zeroBlocks = 0;

  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      zeroBlocks += 1;
      offset += 512;
      if (zeroBlocks >= 2) break;
      continue;
    }
    zeroBlocks = 0;

    const name = header.toString("utf8", 0, 100).replace(/\0.*$/, "");
    const prefix = header.toString("utf8", 345, 500).replace(/\0.*$/, "");
    const size = parseOctal(header, 124, 12);
    const typeflag = String.fromCharCode(header[156] || 0);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > buffer.length) {
      throw new Error("That tar archive is truncated.");
    }
    const fullName = prefix ? `${prefix}/${name}` : name;
    offset = dataStart + Math.ceil(size / 512) * 512;

    if (fullName.endsWith("/") || typeflag === "5") continue; // directory
    if (typeflag === "1" || typeflag === "2") {
      throw new Error(`"${fullName}" is a link, which is never extracted.`);
    }
    if (typeflag !== "0" && typeflag !== "\0" && typeflag !== "7") continue;
    const path = safeEntryPath(fullName);
    if (!path) {
      throw new Error(`"${fullName}" would extract outside the destination.`);
    }
    entries.push({ path, data: Buffer.from(buffer.subarray(dataStart, dataEnd)) });
    if (entries.length > limits.maxEntries) {
      throw new Error(`That archive has more than ${limits.maxEntries} files.`);
    }
  }

  assertWithinLimits(entries, limits);
  return entries;
}

/**
 * Extracts a supported archive by name. `.zip` and the gzip tar family are the
 * formats the participant form accepts; anything else is left as a single file.
 */
export function extractArchive(name, bytes, limits = DEFAULT_LIMITS) {
  const lower = String(name ?? "").toLowerCase();
  const buffer = Buffer.from(bytes);
  if (lower.endsWith(".zip")) {
    return { format: "zip", entries: extractZip(buffer, limits) };
  }
  if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) {
    return { format: "tar.gz", entries: extractTar(gunzipSync(buffer), limits) };
  }
  if (lower.endsWith(".gz")) {
    const inner = gunzipSync(buffer);
    return {
      format: "gz",
      entries: [
        {
          path: safeEntryPath(lower.replace(/\.gz$/, "")) ?? "content",
          data: inner,
        },
      ],
    };
  }
  return { format: "file", entries: [] };
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value;
  }
  return table;
})();

function crc32(buffer) {
  let crc = ~0;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (~crc) >>> 0;
}

/**
 * Builds a plain (uncompressed) zip. Anyone can open it with the tools they
 * already have, which is the point: the operator may need to forward it.
 */
export function createZip(entries) {
  if (entries.length > 0xffff) throw new Error("Too many files for one zip.");

  const locals = [];
  const central = [];
  let offset = 0;
  // 1980-01-01 00:00 keeps the output reproducible.
  const dosTime = 0;
  const dosDate = 0x21;

  for (const entry of entries) {
    const path = safeEntryPath(entry.path);
    if (!path) throw new Error(`Refusing to package "${entry.path}".`);
    const name = Buffer.from(path, "utf8");
    const data = Buffer.from(entry.data);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(ZIP_LOCAL, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(ZIP_CENTRAL, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(dosTime, 12);
    header.writeUInt16LE(dosDate, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(data.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(name.length, 28);
    // `<<` would overflow into a negative int32; multiply to stay unsigned.
    header.writeUInt32LE(0o100644 * 0x10000, 38);
    header.writeUInt32LE(offset, 42);

    locals.push(local, name, data);
    central.push(header, name);
    offset += local.length + name.length + data.length;
  }

  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(ZIP_END, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, directory, end]);
}
