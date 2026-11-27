import assert from "node:assert/strict";
import { deflateRawSync, gzipSync } from "node:zlib";
import { describe, it } from "node:test";

import {
  createZip,
  extractArchive,
  extractTar,
  extractZip,
  safeEntryPath,
} from "../scripts/archive.mjs";

/** Minimal zip writer for fixtures: lets a test choose `store` or `deflate`. */
function buildZip(entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf8");
    const method = entry.method ?? 0;
    const body = method === 8 ? deflateRawSync(entry.data) : Buffer.from(entry.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(0, 14); // crc (not checked by the reader)
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(method, 10);
    header.writeUInt32LE(0, 16);
    header.writeUInt32LE(body.length, 20);
    header.writeUInt32LE(entry.data.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt32LE(entry.externalAttributes ?? 0o100644 * 0x10000, 38);
    header.writeUInt32LE(offset, 42);

    locals.push(local, name, body);
    central.push(header, name);
    offset += local.length + name.length + body.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

function tarHeader(name, size, typeflag = "0") {
  const header = Buffer.alloc(512);
  header.write(name, 0, "utf8");
  header.write("0000644\0", 100, "ascii");
  header.write("0000000\0", 108, "ascii");
  header.write("0000000\0", 116, "ascii");
  header.write(`${size.toString(8).padStart(11, "0")}\0`, 124, "ascii");
  header.write("00000000000\0", 136, "ascii");
  header.write("        ", 148, "ascii");
  header.write(typeflag, 156, "ascii");
  header.write("ustar\0", 257, "ascii");
  header.write("00", 263, "ascii");
  return header;
}

function buildTar(entries) {
  const blocks = [];
  for (const entry of entries) {
    const data = Buffer.from(entry.data ?? "");
    blocks.push(tarHeader(entry.path, data.length, entry.typeflag ?? "0"), data);
    const padding = (512 - (data.length % 512)) % 512;
    if (padding > 0) blocks.push(Buffer.alloc(padding));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

describe("safeEntryPath", () => {
  it("accepts ordinary nested names", () => {
    assert.equal(safeEntryPath("src/app.ts"), "src/app.ts");
    assert.equal(safeEntryPath("./src/./app.ts"), "src/app.ts");
    assert.equal(safeEntryPath("dir\\file.txt"), "dir/file.txt");
  });

  it("refuses anything that would escape the destination", () => {
    for (const name of ["../evil", "a/../../evil", "/etc/passwd", "C:\\Windows\\x", "", "."]) {
      assert.equal(safeEntryPath(name), null, name);
    }
  });
});

describe("extractZip", () => {
  it("reads stored and deflated entries", () => {
    const zip = buildZip([
      { path: "README.md", data: Buffer.from("# hello\n") },
      { path: "src/app.ts", data: Buffer.from("export const a = 1;\n"), method: 8 },
    ]);
    const entries = extractZip(zip);
    assert.deepEqual(
      entries.map((entry) => entry.path),
      ["README.md", "src/app.ts"],
    );
    assert.equal(entries[1].data.toString(), "export const a = 1;\n");
  });

  it("skips directory entries", () => {
    const zip = buildZip([
      { path: "src/", data: Buffer.alloc(0) },
      { path: "src/app.ts", data: Buffer.from("x") },
    ]);
    assert.deepEqual(
      extractZip(zip).map((entry) => entry.path),
      ["src/app.ts"],
    );
  });

  it("refuses a traversal entry, an absolute entry and a symlink", () => {
    assert.throws(
      () => extractZip(buildZip([{ path: "../evil.txt", data: Buffer.from("x") }])),
      /outside the destination/,
    );
    assert.throws(
      () => extractZip(buildZip([{ path: "/etc/passwd", data: Buffer.from("x") }])),
      /outside the destination/,
    );
    assert.throws(
      () =>
        extractZip(
          buildZip([
            {
              path: "link",
              data: Buffer.from("/etc/passwd"),
              externalAttributes: 0o120777 * 0x10000,
            },
          ]),
        ),
      /is a link/,
    );
  });

  it("refuses an entry count above the limit", () => {
    const zip = buildZip([
      { path: "a", data: Buffer.from("1") },
      { path: "b", data: Buffer.from("2") },
    ]);
    assert.throws(
      () => extractZip(zip, { maxEntries: 1, maxEntryBytes: 10, maxTotalBytes: 10 }),
      /limit is 1/,
    );
  });

  it("refuses a file that is not a zip", () => {
    assert.throws(() => extractZip(Buffer.from("not a zip at all")), /not a readable zip/);
  });
});

describe("extractTar", () => {
  it("reads regular files and skips directories", () => {
    const tar = buildTar([
      { path: "src/", typeflag: "5" },
      { path: "src/app.ts", data: "const a = 1;\n" },
    ]);
    const entries = extractTar(tar);
    assert.deepEqual(entries.map((entry) => entry.path), ["src/app.ts"]);
    assert.equal(entries[0].data.toString(), "const a = 1;\n");
  });

  it("refuses links and traversal", () => {
    assert.throws(
      () => extractTar(buildTar([{ path: "link", typeflag: "2" }])),
      /is a link/,
    );
    assert.throws(
      () => extractTar(buildTar([{ path: "../evil", data: "x" }])),
      /outside the destination/,
    );
  });
});

describe("extractArchive", () => {
  it("routes by extension and leaves other files alone", () => {
    const zip = extractArchive("bundle.zip", buildZip([{ path: "a.txt", data: Buffer.from("a") }]));
    assert.equal(zip.format, "zip");
    assert.equal(zip.entries.length, 1);

    const tarball = extractArchive(
      "bundle.tar.gz",
      gzipSync(buildTar([{ path: "b.txt", data: "b" }])),
    );
    assert.equal(tarball.format, "tar.gz");
    assert.equal(tarball.entries[0].path, "b.txt");

    assert.deepEqual(extractArchive("notes.pdf", Buffer.from("%PDF-1.7")), {
      format: "file",
      entries: [],
    });
  });
});

describe("createZip", () => {
  it("round-trips through the extractor", () => {
    const zip = createZip([
      { path: "submission.json", data: Buffer.from('{"id":"x"}\n') },
      { path: "attachments/a.txt", data: Buffer.from("hello") },
    ]);
    const entries = extractZip(zip);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].data.toString(), '{"id":"x"}\n');
    assert.equal(entries[1].data.toString(), "hello");
  });

  it("refuses to package a path outside the destination", () => {
    assert.throws(
      () => createZip([{ path: "../escape.txt", data: Buffer.from("x") }]),
      /Refusing to package/,
    );
  });
});
