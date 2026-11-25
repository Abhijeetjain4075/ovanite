import { afterEach, describe, expect, it, vi } from "vitest";

import {
  IntakeError,
  isDuplicateIntakeResult,
  isIntakeOpen,
  submitIntake,
} from "./intake";
import { setRuntimeConfig } from "./runtimeConfigStore";

const ORIGIN = "https://intake.example.test";

function configure(value: string) {
  setRuntimeConfig({ intake_api_origin: value });
}

function response(status: number, body: unknown) {
  return {
    status,
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  setRuntimeConfig({});
  vi.restoreAllMocks();
});

describe("intake configuration", () => {
  it("is closed for an absent, placeholder or non-HTTPS endpoint", () => {
    for (const value of [
      "undefined",
      "",
      "http://intake.example.test",
      "https://intake.example.test/api",
      "not a url",
    ]) {
      configure(value);
      expect(isIntakeOpen(), value).toBe(false);
    }
  });

  it("is open only for an HTTPS origin", () => {
    configure(ORIGIN);
    expect(isIntakeOpen()).toBe(true);
  });
});

describe("submitIntake", () => {
  it("posts JSON to the configured endpoint without credentials", async () => {
    configure(ORIGIN);
    const fetcher = vi.fn(async () =>
      response(201, { ok: true, status: "received", reference: "ref-1" }),
    );

    const outcome = await submitIntake(
      "contact",
      {
        name: "Ada",
        email: "ada@example.test",
        message: "Hello there, world.",
      },
      { fetcher: fetcher as unknown as typeof fetch },
    );

    expect(outcome).toEqual({ status: "received", reference: "ref-1" });
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${ORIGIN}/api/intake`);
    expect(init).toMatchObject({
      method: "POST",
      credentials: "omit",
      cache: "no-store",
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      kind: "contact",
      email: "ada@example.test",
    });
  });

  it("reports a duplicate as a duplicate rather than a failure", async () => {
    configure(ORIGIN);
    const outcome = await submitIntake(
      "waitlist",
      { name: "Ada", email: "ada@example.test" },
      {
        fetcher: (async () =>
          response(200, {
            ok: true,
            status: "duplicate",
          })) as unknown as typeof fetch,
      },
    );

    expect(outcome.status).toBe("duplicate");
    expect(isDuplicateIntakeResult(outcome)).toBe(true);
  });

  it("surfaces server field errors", async () => {
    configure(ORIGIN);
    const error = await submitIntake(
      "contact",
      { name: "A", email: "nope", message: "short" },
      {
        fetcher: (async () =>
          response(400, {
            ok: false,
            error: "invalid",
            fields: { email: "Please enter a valid email address." },
          })) as unknown as typeof fetch,
      },
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(IntakeError);
    expect((error as IntakeError).reason).toBe("invalid");
    expect((error as IntakeError).fields.email).toMatch(/valid email/);
  });

  it("reports rate limiting distinctly from an outage", async () => {
    configure(ORIGIN);
    const limited = await submitIntake(
      "contact",
      {
        name: "Ada",
        email: "ada@example.test",
        message: "Hello there, world.",
      },
      {
        fetcher: (async () =>
          response(429, {
            ok: false,
            error: "rate_limited",
          })) as unknown as typeof fetch,
      },
    ).catch((caught: unknown) => caught);
    expect((limited as IntakeError).reason).toBe("rate_limited");

    const offline = await submitIntake(
      "contact",
      {
        name: "Ada",
        email: "ada@example.test",
        message: "Hello there, world.",
      },
      {
        fetcher: (async () => {
          throw new TypeError("network down");
        }) as unknown as typeof fetch,
      },
    ).catch((caught: unknown) => caught);
    expect((offline as IntakeError).reason).toBe("unavailable");
    expect((offline as IntakeError).message).toMatch(/Nothing was submitted/);
  });

  it("never reports success for an unexpected response", async () => {
    configure(ORIGIN);
    const error = await submitIntake(
      "participant",
      {
        name: "Ada",
        email: "ada@example.test",
        project: "P",
        message: "Long enough.",
      },
      {
        fetcher: (async () =>
          response(201, {
            ok: true,
            status: "something-else",
          })) as unknown as typeof fetch,
      },
    ).catch((caught: unknown) => caught);

    expect((error as IntakeError).reason).toBe("unavailable");
  });

  it("refuses to call anything when intake is not configured", async () => {
    const fetcher = vi.fn();
    const error = await submitIntake(
      "contact",
      {
        name: "Ada",
        email: "ada@example.test",
        message: "Hello there, world.",
      },
      { fetcher: fetcher as unknown as typeof fetch },
    ).catch((caught: unknown) => caught);

    expect((error as IntakeError).reason).toBe("not_configured");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
