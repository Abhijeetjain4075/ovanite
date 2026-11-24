import { createServer, type Server } from "node:http";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerStorageProxy, resolveSignedRedirect } from "./storageProxy";

describe("resolveSignedRedirect", () => {
  it("accepts absolute http(s) URLs and normalizes them", () => {
    expect(resolveSignedRedirect("https://cdn.example.com/a/b.pdf?sig=1")).toBe(
      "https://cdn.example.com/a/b.pdf?sig=1",
    );
    expect(resolveSignedRedirect("  http://127.0.0.1:9000/object  ")).toBe(
      "http://127.0.0.1:9000/object",
    );
  });

  it("rejects every non-HTTP scheme", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html;base64,AAAA",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "//cdn.example.com/a.pdf",
      "ftp://cdn.example.com/a.pdf",
    ]) {
      expect(resolveSignedRedirect(value)).toBeNull();
    }
  });

  it("rejects credentials, control characters, whitespace and non-strings", () => {
    for (const value of [
      "https://user:pass@cdn.example.com/a.pdf",
      "https://user@cdn.example.com/a.pdf",
      "https://cdn.example.com/a\tb.pdf",
      "https://cdn.example.com/a\nb.pdf",
      "https://cdn.example.com/a\\b.pdf",
      "https://cdn.example.com/\u0000",
      "",
      "   ",
      null,
      undefined,
      42,
      { url: "https://cdn.example.com/a.pdf" },
    ]) {
      expect(resolveSignedRedirect(value)).toBeNull();
    }
  });

  it("rejects values beyond the length bound", () => {
    expect(resolveSignedRedirect(`https://cdn.example.com/${"a".repeat(5000)}`)).toBeNull();
  });
});

describe("storage proxy route", () => {
  let server: Server;
  let baseUrl = "";

  beforeAll(async () => {
    const app = express();
    registerStorageProxy(app);
    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port available.");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it("rejects traversal keys before calling the storage backend", async () => {
    // The separator is percent-encoded so the URL parser cannot collapse the
    // `..` segment before Express sees it; the route must still reject it.
    const response = await fetch(`${baseUrl}/manus-storage/..%2Fsecrets.txt`);
    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid storage key");
  });

  it("rejects encoded traversal, empty segments and backslash keys", async () => {
    for (const key of [
      "..%2Fsecrets.txt",
      "sub/..%2F..%2Fsecrets.txt",
      "evidence//report.pdf",
      "a%5Cb.pdf",
    ]) {
      const response = await fetch(`${baseUrl}/manus-storage/${key}`);
      expect(response.status).toBe(400);
    }
  });

  it("reports an unconfigured backend instead of redirecting", async () => {
    const response = await fetch(`${baseUrl}/manus-storage/evidence/report.pdf`, {
      redirect: "manual",
    });
    // No MANUS_API_* credentials are set in the test environment, so the route
    // must fail closed rather than emit a redirect to an unknown location.
    expect(response.status).toBe(500);
    expect(response.headers.get("location")).toBeNull();
  });
});
