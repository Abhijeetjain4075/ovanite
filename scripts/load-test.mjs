#!/usr/bin/env node
/**
 * Bounded load test for a deliberately selected HTTP target.
 *
 * Latency covers the complete response body (not only time-to-first-byte).
 * Response bodies and latency samples are capped so a target cannot exhaust
 * the runner's memory. A real SLO verdict still requires representative data.
 *
 * Exit codes: 0 = objectives met, 1 = invalid usage, 2 = objective breached.
 */
import { performance } from "node:perf_hooks";

const DEFAULTS = {
  concurrency: 10,
  duration: 10,
  p95: 1_000,
  maxErrorRate: 0.01,
  timeoutMs: 5_000,
  maxResponseBytes: 1_048_576,
};
const MAX_LATENCY_SAMPLES = 20_000;

const USAGE = `Usage: node scripts/load-test.mjs --url <http(s) URL> [options]

Options:
  --url <url>               Target URL (required)
  --concurrency <n>         Parallel workers (default ${DEFAULTS.concurrency}, max 200)
  --duration <seconds>      Test duration (default ${DEFAULTS.duration}, max 300)
  --p95 <milliseconds>      Full-response p95 objective (default ${DEFAULTS.p95})
  --max-error-rate <ratio>  Maximum non-2xx/3xx ratio (default ${DEFAULTS.maxErrorRate})
  --timeout <milliseconds>  Per-request timeout (default ${DEFAULTS.timeoutMs})
  --max-response-bytes <n>  Max body bytes per response (default ${DEFAULTS.maxResponseBytes})
  --header <name: value>    Extra request header, repeatable
  --json                    Print only the machine-readable summary`;

function parseArgs(argv) {
  const options = { ...DEFAULTS, url: null, headers: {}, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined) throw new Error(`Missing value for ${flag}`);
      index += 1;
      return next;
    };
    switch (flag) {
      case "--url": options.url = value(); break;
      case "--concurrency": options.concurrency = Number(value()); break;
      case "--duration": options.duration = Number(value()); break;
      case "--p95": options.p95 = Number(value()); break;
      case "--max-error-rate": options.maxErrorRate = Number(value()); break;
      case "--timeout": options.timeoutMs = Number(value()); break;
      case "--max-response-bytes": options.maxResponseBytes = Number(value()); break;
      case "--header": {
        const header = value();
        const separator = header.indexOf(":");
        if (separator <= 0) throw new Error("Invalid --header value.");
        const name = header.slice(0, separator).trim();
        const headerValue = header.slice(separator + 1).trim();
        if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) || /[\r\n]/.test(headerValue)) {
          throw new Error("Invalid --header name or value.");
        }
        options.headers[name] = headerValue;
        break;
      }
      case "--json": options.json = true; break;
      case "--help":
      case "-h": console.info(USAGE); process.exit(0); break;
      default: throw new Error(`Unknown argument: ${flag}`);
    }
  }
  return options;
}

function validate(options) {
  let url;
  try { url = new URL(options.url ?? ""); }
  catch { throw new Error("--url must be an absolute http(s) URL."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("--url must use http or https.");
  if (url.username || url.password) throw new Error("--url must not contain credentials.");

  const bounded = (name, min, max) => {
    if (!Number.isSafeInteger(options[name]) || options[name] < min || options[name] > max) {
      throw new Error(`--${name.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)} must be an integer between ${min} and ${max}.`);
    }
  };
  bounded("concurrency", 1, 200);
  bounded("duration", 1, 300);
  bounded("p95", 1, 600_000);
  bounded("timeoutMs", 100, 120_000);
  bounded("maxResponseBytes", 1, 10 * 1024 * 1024);
  if (!Number.isFinite(options.maxErrorRate) || options.maxErrorRate < 0 || options.maxErrorRate > 1) {
    throw new Error("--max-error-rate must be between 0 and 1.");
  }
  return url;
}

function percentile(sorted, ratio) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(ratio * sorted.length) - 1));
  return sorted[index];
}

async function drainResponse(response, maxBytes) {
  if (!response.body) return 0;
  const reader = response.body.getReader();
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel().catch(() => undefined);
        const error = new Error("response_body_too_large");
        error.code = "RESPONSE_BODY_TOO_LARGE";
        throw error;
      }
    }
  } finally {
    reader.releaseLock();
  }
  return received;
}

async function main() {
  let options;
  let url;
  try {
    options = parseArgs(process.argv.slice(2));
    url = validate(options);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const latencySamples = [];
  let measured = 0;
  let ok = 0;
  let failed = 0;
  let statusErrors = 0;
  let networkErrors = 0;
  let responseTooLargeErrors = 0;
  const startedAt = performance.now();
  const deadline = startedAt + options.duration * 1_000;

  function recordLatency(value) {
    measured += 1;
    if (latencySamples.length < MAX_LATENCY_SAMPLES) {
      latencySamples.push(value);
      return;
    }
    // Reservoir sampling keeps a representative bounded sample for long runs.
    const candidate = Math.floor(Math.random() * measured);
    if (candidate < MAX_LATENCY_SAMPLES) latencySamples[candidate] = value;
  }

  async function worker() {
    while (performance.now() < deadline) {
      const requestStarted = performance.now();
      try {
        const response = await fetch(url, {
          headers: options.headers,
          redirect: "manual",
          signal: AbortSignal.timeout(options.timeoutMs),
        });
        await drainResponse(response, options.maxResponseBytes);
        if (response.status >= 200 && response.status < 400) ok += 1;
        else {
          failed += 1;
          statusErrors += 1;
        }
      } catch (error) {
        failed += 1;
        if (error && typeof error === "object" && error.code === "RESPONSE_BODY_TOO_LARGE") {
          responseTooLargeErrors += 1;
        } else {
          networkErrors += 1;
        }
      } finally {
        recordLatency(performance.now() - requestStarted);
      }
    }
  }

  await Promise.all(Array.from({ length: options.concurrency }, () => worker()));

  const elapsedSeconds = Math.max(0.001, (performance.now() - startedAt) / 1_000);
  const sorted = [...latencySamples].sort((a, b) => a - b);
  const errorRate = measured === 0 ? 1 : failed / measured;
  const summary = {
    target: url.origin + url.pathname,
    concurrency: options.concurrency,
    durationSeconds: Number(elapsedSeconds.toFixed(2)),
    requests: measured,
    requestsPerSecond: Number((measured / elapsedSeconds).toFixed(2)),
    ok,
    failed,
    statusErrors,
    networkErrors,
    responseTooLargeErrors,
    errorRate: Number(errorRate.toFixed(4)),
    latencyMs: {
      sampleCount: sorted.length,
      sampleLimit: MAX_LATENCY_SAMPLES,
      percentileMethod: "nearest-rank over bounded reservoir sample",
      p50: percentile(sorted, 0.5),
      p90: percentile(sorted, 0.9),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
      maxSampled: sorted.at(-1) ?? 0,
    },
    maxResponseBytes: options.maxResponseBytes,
    objectives: { p95Ms: options.p95, maxErrorRate: options.maxErrorRate },
    passed: true,
  };

  if (measured === 0 || summary.latencyMs.sampleCount === 0) summary.passed = false;
  if (summary.latencyMs.p95 > options.p95 || errorRate > options.maxErrorRate) summary.passed = false;

  if (options.json) {
    console.info(JSON.stringify(summary));
  } else {
    console.info(`Target            ${summary.target}`);
    console.info(`Concurrency       ${summary.concurrency}`);
    console.info(`Duration          ${summary.durationSeconds}s`);
    console.info(`Requests          ${summary.requests} (${summary.requestsPerSecond}/s)`);
    console.info(`Errors            ${summary.failed} (rate ${summary.errorRate})`);
    console.info(`Large bodies      ${summary.responseTooLargeErrors}`);
    console.info(`Latency           p50 ${summary.latencyMs.p50}ms  p90 ${summary.latencyMs.p90}ms  p95 ${summary.latencyMs.p95}ms  p99 ${summary.latencyMs.p99}ms  max sampled ${summary.latencyMs.maxSampled}ms`);
    console.info(`Objectives        p95 <= ${options.p95}ms, error rate <= ${options.maxErrorRate}`);
    console.info(summary.passed ? "Result            PASS" : "Result            FAIL");
  }
  process.exitCode = summary.passed ? 0 : 2;
}

await main();
