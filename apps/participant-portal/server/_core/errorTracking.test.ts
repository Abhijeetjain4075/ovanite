import { describe, expect, it, vi } from "vitest";

import { createErrorReporter } from "./errorTracking";

describe("createErrorReporter", () => {
  it("emits one structured line without leaking the exception message", () => {
    const lines: string[] = [];
    const reporter = createErrorReporter({
      release: "v1.2.3",
      sink: (line) => lines.push(line),
      now: () => Date.UTC(2026, 0, 2, 3, 4, 5),
    });

    const error = Object.assign(
      new Error("connection to mysql://user:secret@db.internal failed"),
      { code: "ECONNREFUSED" },
    );

    const event = reporter.report("server_start", error, {
      requestId: "req-12345678",
    });

    expect(event).toEqual({
      event: "portal_error",
      timestamp: "2026-01-02T03:04:05.000Z",
      release: "v1.2.3",
      requestId: "req-12345678",
      operation: "server_start",
      name: "Error",
      code: "ECONNREFUSED",
      category: "connection",
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain("secret");
    expect(lines[0]).not.toContain("mysql://");
    expect(JSON.parse(lines[0])).toEqual(event);
  });

  it("drops unknown exception names, codes and unsafe identifiers", () => {
    const reporter = createErrorReporter({
      release: "release with spaces",
      sink: () => {},
      now: () => 0,
    });

    const event = reporter.report("bad operation!", {
      name: "CustomLeakyError",
      code: "SUPER_SECRET",
    }, { requestId: "not a safe id" });

    expect(event.release).toBe("unknown");
    expect(event.operation).toBe("operation");
    expect(event.name).toBe("Error");
    expect(event.code).toBeNull();
    expect(event.requestId).toBeNull();
  });

  it("keeps a bounded recent buffer for diagnostics", () => {
    const reporter = createErrorReporter({ sink: () => {}, maxRecent: 3 });
    for (let index = 0; index < 5; index += 1) {
      reporter.report(`op_${index}`, new Error("x"));
    }
    const recent = reporter.recent();
    expect(recent).toHaveLength(3);
    expect(recent.map((event) => event.operation)).toEqual([
      "op_2",
      "op_3",
      "op_4",
    ]);
  });

  it("survives a throwing log sink", () => {
    const reporter = createErrorReporter({
      sink: () => {
        throw new Error("disk full");
      },
    });
    expect(() => reporter.report("server_runtime", new Error("boom"))).not.toThrow();
    expect(reporter.recent()).toHaveLength(1);
  });

  it("posts to an HTTPS webhook without blocking the caller", async () => {
    const fetchImpl = vi.fn(async () => new Response("ok"));
    const reporter = createErrorReporter({
      sink: () => {},
      webhookUrl: "https://tracker.example.test/events",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => 0,
    });

    reporter.report("http_request", new Error("boom"));
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://tracker.example.test/events");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({
      event: "portal_error",
      operation: "http_request",
    });
  });

  it("ignores insecure or malformed webhook URLs", async () => {
    for (const webhookUrl of [
      "http://tracker.example.test/events",
      "https://user:pass@tracker.example.test/events",
      "not-a-url",
    ]) {
      const fetchImpl = vi.fn(async () => new Response("ok"));
      const reporter = createErrorReporter({
        sink: () => {},
        webhookUrl,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        now: () => 0,
      });
      reporter.report("server_runtime", new Error("boom"));
      await Promise.resolve();
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it("swallows webhook delivery failures", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const reporter = createErrorReporter({
      sink: () => {},
      webhookUrl: "https://tracker.example.test/events",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(() => reporter.report("server_runtime", new Error("boom"))).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
