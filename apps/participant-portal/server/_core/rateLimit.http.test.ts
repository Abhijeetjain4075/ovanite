import { createServer, type Server } from "node:http";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRateLimitMiddleware } from "./rateLimit";

describe("rate-limit middleware over HTTP", () => {
  let server: Server;
  let baseUrl = "";

  beforeAll(async () => {
    const app = express();
    app.use(createRateLimitMiddleware({
      write: { windowMs: 60_000, max: 1 },
    }));
    app.post("/api/trpc/probe", (_req, res) => res.status(200).json({ ok: true }));
    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port available.");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it("applies the same bucket to lowercase and Express-case-insensitive uppercase routes", async () => {
    const first = await fetch(`${baseUrl}/api/trpc/probe`, { method: "POST" });
    expect(first.status).toBe(200);

    const bypassAttempt = await fetch(`${baseUrl}/API/TRPC/probe`, { method: "POST" });
    expect(bypassAttempt.status).toBe(429);
    expect(bypassAttempt.headers.get("retry-after")).toBe("60");
    await expect(bypassAttempt.json()).resolves.toMatchObject({
      error: "Too many requests. Retry later.",
    });
  });
});
