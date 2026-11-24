import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import test from "node:test";

const SCRIPT = "scripts/load-test.mjs";

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function withServer(handler, runTest) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await runTest(`http://127.0.0.1:${port}/health`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("rejects invalid usage with exit code 1", async () => {
  const missingUrl = await run([]);
  assert.equal(missingUrl.code, 1);
  assert.match(missingUrl.stderr, /--url must be an absolute/);

  const badConcurrency = await run(["--url", "http://127.0.0.1:1/", "--concurrency", "0"]);
  assert.equal(badConcurrency.code, 1);

  const credentialed = await run(["--url", "https://user:pass@example.test/"]);
  assert.equal(credentialed.code, 1);
  assert.match(credentialed.stderr, /must not contain credentials/);

  const help = await run(["--help"]);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /Usage: node scripts\/load-test\.mjs/);
});

test("passes against a healthy target and reports the summary", async () => {
  await withServer(
    (_request, response) => {
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("ok");
    },
    async (url) => {
      const result = await run([
        "--url",
        url,
        "--concurrency",
        "2",
        "--duration",
        "1",
        "--p95",
        "5000",
        "--json",
      ]);
      assert.equal(result.code, 0, result.stderr);
      const summary = JSON.parse(result.stdout.trim());
      assert.ok(summary.requests > 0);
      assert.equal(summary.failed, 0);
      assert.equal(summary.passed, true);
      assert.ok(summary.latencyMs.p95 >= 0);
    },
  );
});

test("fails with exit code 2 when the target returns server errors", async () => {
  await withServer(
    (_request, response) => {
      response.writeHead(500);
      response.end("boom");
    },
    async (url) => {
      const result = await run([
        "--url",
        url,
        "--concurrency",
        "2",
        "--duration",
        "1",
        "--max-error-rate",
        "0",
        "--json",
      ]);
      assert.equal(result.code, 2);
      const summary = JSON.parse(result.stdout.trim());
      assert.equal(summary.passed, false);
      assert.ok(summary.statusErrors > 0);
    },
  );
});

test("fails when the p95 objective is breached", async () => {
  await withServer(
    (_request, response) => {
      setTimeout(() => {
        response.writeHead(200);
        response.end("slow");
      }, 120);
    },
    async (url) => {
      const result = await run([
        "--url",
        url,
        "--concurrency",
        "1",
        "--duration",
        "1",
        "--p95",
        "1",
        "--max-error-rate",
        "1",
        "--json",
      ]);
      assert.equal(result.code, 2);
      const summary = JSON.parse(result.stdout.trim());
      assert.equal(summary.passed, false);
    },
  );
});
