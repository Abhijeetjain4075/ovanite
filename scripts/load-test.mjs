#!/usr/bin/env node
/**
 * Dependency-free load test for a deployed HTTP target.
 *
 * CI cannot produce a real SLO verdict without a deployed environment, so this
 * lane is deliberate: it is executed against a chosen target and fails on a
 * breached latency or error-rate objective instead of printing numbers nobody
 * acts on.
 *
 * Usage:
 *   node scripts/load-test.mjs --url https://portal.example.test/api/health/live \
 *     --concurrency 20 --duration 30 --p95 500 --max-error-rate 0.01
 *
 * Exit codes: 0 = objectives met, 1 = invalid usage, 2 = objective breached.
 */
const DEFAULTS = {
  concurrency: 10,
  duration: 10,
  p95: 1_000,
  maxErrorRate: 0.01,
  timeoutMs: 5_000,
};

const USAGE = `Usage: node scripts/load-test.mjs --url <https URL> [options]

Options:
  --url <url>               Target URL (required, http or https)
  --concurrency <n>         Parallel workers (default ${DEFAULTS.concurrency}, max 200)
  --duration <seconds>      Test duration (default ${DEFAULTS.duration}, max 300)
  --p95 <milliseconds>      p95 latency objective (default ${DEFAULTS.p95})
  --max-error-rate <ratio>  Maximum non-2xx/3xx ratio (default ${DEFAULTS.maxErrorRate})
  --timeout <milliseconds>  Per-request timeout (default ${DEFAULTS.timeoutMs})
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
      case "--url":
        options.url = value();
        break;
      case "--concurrency":
        options.concurrency = Number(value());
        break;
      case "--duration":
        options.duration = Number(value());
        break;
      case "--p95":
        options.p95 = Number(value());
        break;
      case "--max-error-rate":
        options.maxErrorRate = Number(value());
        break;
      case "--timeout":
        options.timeoutMs = Number(value());
        break;
      case "--header": {
        const header = value();
        const separator = header.indexOf(":");
        if (separator <= 0) throw new Error(`Invalid header: ${header}`);
        options.headers[header.slice(0, separator).trim()] = header
          .slice(separator + 1)
          .trim();
        break;
      }
      case "--json":
        options.json = true;
        break;
      case "--help":
      case "-h":
        console.info(USAGE);
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${flag}`);
    }
  }
  return options;
}

function validate(options) {
  let url;
  try {
    url = new URL(options.url ?? "");
  } catch {
    throw new Error("--url must be an absolute http(s) URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("--url must use http or https.");
  }
  if (url.username || url.password) {
    throw new Error("--url must not contain credentials.");
  }
  const bounded = (name, min, max) => {
    if (!Number.isFinite(options[name]) || options[name] < min || options[name] > max) {
      throw new Error(`--${name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)} must be between ${min} and ${max}.`);
    }
  };
  bounded("concurrency", 1, 200);
  bounded("duration", 1, 300);
  bounded("p95", 1, 600_000);
  bounded("timeoutMs", 100, 120_000);
  if (!Number.isFinite(options.maxErrorRate) || options.maxErrorRate < 0 || options.maxErrorRate > 1) {
    throw new Error("--max-error-rate must be between 0 and 1.");
  }
  return url;
}

function percentile(sorted, ratio) {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(ratio * sorted.length) - 1),
  );
  return sorted[index];
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
    process.exit(1);
  }

  const latencies = [];
  let ok = 0;
  let failed = 0;
  let statusErrors = 0;
  let networkErrors = 0;
  const startedAt = Date.now();
  const deadline = startedAt + options.duration * 1_000;

  async function worker() {
    while (Date.now() < deadline) {
      const requestStarted = Date.now();
      const remaining = Math.max(200, deadline - requestStarted);
      try {
        const response = await fetch(url, {
          headers: options.headers,
          redirect: "manual",
          signal: AbortSignal.timeout(
            Math.min(options.timeoutMs, remaining + options.timeoutMs),
          ),
        });
        latencies.push(Date.now() - requestStarted);
        await response.arrayBuffer();
        if (response.status >= 200 && response.status < 400) ok += 1;
        else {
          failed += 1;
          statusErrors += 1;
        }
      } catch {
        latencies.push(Date.now() - requestStarted);
        failed += 1;
        networkErrors += 1;
      }
    }
  }

  await Promise.all(
    Array.from({ length: options.concurrency }, () => worker()),
  );

  const elapsedSeconds = Math.max(0.001, (Date.now() - startedAt) / 1_000);
  const sorted = [...latencies].sort((left, right) => left - right);
  const total = latencies.length;
  const errorRate = total === 0 ? 1 : failed / total;
  const summary = {
    target: url.origin + url.pathname,
    concurrency: options.concurrency,
    durationSeconds: Number(elapsedSeconds.toFixed(2)),
    requests: total,
    requestsPerSecond: Number((total / elapsedSeconds).toFixed(2)),
    ok,
    failed,
    statusErrors,
    networkErrors,
    errorRate: Number(errorRate.toFixed(4)),
    latencyMs: {
      p50: percentile(sorted, 0.5),
      p90: percentile(sorted, 0.9),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
      max: sorted.at(-1) ?? 0,
    },
    objectives: {
      p95Ms: options.p95,
      maxErrorRate: options.maxErrorRate,
    },
    passed: true,
  };

  // An empty run (for example a target that refuses instantly) is a failure, not
  // a pass: it proves nothing about capacity.
  if (total === 0) summary.passed = false;
  if (summary.latencyMs.p95 > options.p95) summary.passed = false;
  if (errorRate > options.maxErrorRate) summary.passed = false;

  if (options.json) {
    console.info(JSON.stringify(summary));
  } else {
    console.info(`Target            ${summary.target}`);
    console.info(`Concurrency       ${summary.concurrency}`);
    console.info(`Duration          ${summary.durationSeconds}s`);
    console.info(`Requests          ${summary.requests} (${summary.requestsPerSecond}/s)`);
    console.info(`Errors            ${summary.failed} (rate ${summary.errorRate})`);
    console.info(
      `Latency           p50 ${summary.latencyMs.p50}ms  p90 ${summary.latencyMs.p90}ms  p95 ${summary.latencyMs.p95}ms  p99 ${summary.latencyMs.p99}ms  max ${summary.latencyMs.max}ms`,
    );
    console.info(
      `Objectives        p95 <= ${options.p95}ms, error rate <= ${options.maxErrorRate}`,
    );
    console.info(summary.passed ? "Result            PASS" : "Result            FAIL");
  }

  process.exit(summary.passed ? 0 : 2);
}

await main();
