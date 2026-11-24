import { describe, expect, it, vi } from "vitest";

import {
  findRuntimeConfigProblems,
  isLocalRuntimeHost,
  loadRuntimeConfig,
} from "./runtimeConfig";

const healthy = {
  backend_host: "https://icp-api.io",
  backend_canister_id: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  project_id: "undefined",
  ii_derivation_origin: "https://ovanite.vercel.app",
  storage_gateway_url: "undefined",
};

function jsonResponse(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
  } as unknown as Response;
}

describe("findRuntimeConfigProblems", () => {
  it("accepts a fully configured contract", () => {
    expect(findRuntimeConfigProblems(healthy)).toEqual([]);
  });

  it("rejects the shipped placeholder contract", () => {
    const problems = findRuntimeConfigProblems({
      backend_host: "undefined",
      backend_canister_id: "undefined",
      project_id: "undefined",
      ii_derivation_origin: "undefined",
      storage_gateway_url: "undefined",
    });
    expect(problems).toHaveLength(2);
    expect(problems.join("\n")).toMatch(/backend_host is unset or still/);
    expect(problems.join("\n")).toMatch(
      /backend_canister_id is unset or still/,
    );
  });

  it("rejects non-canonical and malformed principals", () => {
    expect(
      findRuntimeConfigProblems({
        ...healthy,
        backend_canister_id: "not-a-principal",
      }).join("\n"),
    ).toMatch(/must be a valid Internet Computer principal/);

    // Upper-case text is not a parseable principal; the guard must reject it
    // rather than passing it through to the actor library.
    expect(
      findRuntimeConfigProblems({
        ...healthy,
        backend_canister_id: "RYJL3-TYAAA-AAAAA-AAABA-CAI",
      }).join("\n"),
    ).toMatch(/must be a valid Internet Computer principal/);
  });

  it("rejects an insecure or path-bearing backend host", () => {
    expect(
      findRuntimeConfigProblems({
        ...healthy,
        backend_host: "http://icp-api.io",
      }).join("\n"),
    ).toMatch(/backend_host must use HTTPS/);

    expect(
      findRuntimeConfigProblems({
        ...healthy,
        backend_host: "https://icp-api.io/api",
      }).join("\n"),
    ).toMatch(/backend_host must be an origin only/);
  });

  it("rejects credential-bearing and non-HTTPS optional URLs", () => {
    expect(
      findRuntimeConfigProblems({
        ...healthy,
        storage_gateway_url: "https://user:pass@storage.example.test",
      }).join("\n"),
    ).toMatch(/must not contain URL credentials/);

    expect(
      findRuntimeConfigProblems({
        ...healthy,
        ii_derivation_origin: "http://ovanite.example.test",
      }).join("\n"),
    ).toMatch(/ii_derivation_origin must use HTTPS/);
  });

  it("rejects a non-object contract", () => {
    expect(findRuntimeConfigProblems([]).join("\n")).toMatch(
      /must contain a JSON object/,
    );
    expect(findRuntimeConfigProblems("nope").join("\n")).toMatch(
      /must contain a JSON object/,
    );
  });
});

describe("loadRuntimeConfig", () => {
  it("requests env.json without caching and returns string values", async () => {
    const fetcher = vi.fn(async () => jsonResponse(healthy));
    await expect(
      loadRuntimeConfig(fetcher as unknown as typeof fetch),
    ).resolves.toEqual(healthy);
    expect(fetcher).toHaveBeenCalledWith(
      "/env.json",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("fails loudly on an HTTP error instead of returning a default", async () => {
    const fetcher = vi.fn(async () => jsonResponse({}, { status: 404 }));
    await expect(
      loadRuntimeConfig(fetcher as unknown as typeof fetch),
    ).rejects.toThrow(/returned HTTP 404/);
  });

  it("fails loudly on invalid JSON", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    })) as unknown as typeof fetch;
    await expect(loadRuntimeConfig(fetcher)).rejects.toThrow(
      /did not contain valid JSON/,
    );
  });

  it("fails loudly when the payload is not an object", async () => {
    const fetcher = vi.fn(async () => jsonResponse(["undefined"]));
    await expect(
      loadRuntimeConfig(fetcher as unknown as typeof fetch),
    ).rejects.toThrow(/must contain a JSON object/);
  });
});

describe("isLocalRuntimeHost", () => {
  it("recognises local development hosts only", () => {
    for (const host of [
      "localhost",
      "127.0.0.1",
      "::1",
      "[::1]",
      "app.localhost",
    ]) {
      expect(isLocalRuntimeHost(host)).toBe(true);
    }
    for (const host of ["ovanite.vercel.app", "example.com", "notlocalhost"]) {
      expect(isLocalRuntimeHost(host)).toBe(false);
    }
  });
});
