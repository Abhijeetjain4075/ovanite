import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerAssessmentCallbackRoute } from "../portal/assessmentCallbackRoute";
import { getDb } from "../db";
import {
  automatedAssessmentRuns,
  decisions,
  evaluations,
  portalAuditEvents,
  rubricVersions,
  submissions,
  termsVersions,
  users,
  validationResults,
  withdrawals,
} from "../../drizzle/schema";
import { checkPortalReadiness } from "./readiness";
import { registerStorageProxy } from "./storageProxy";
import { createRateLimitMiddleware, parseTrustedProxyHops } from "./rateLimit";
import { describeOperationalFailure } from "./redact";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // This portal accepts links and text metadata, not source-archive uploads.
  // Small request limits reduce memory pressure from oversized request bodies.
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    // Only in production: local and test traffic is plain HTTP, and HSTS there
    // would pin a scheme the developer cannot serve. Subdomains are excluded
    // deliberately—sibling hosts may still be HTTP-only—so this header cannot
    // lock a domain the portal does not own the TLS story for.
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=15552000");
    }
    next();
  });
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  // Trust only a bounded number of proxy hops. With the default of zero,
  // req.ip is the socket address and X-Forwarded-For cannot be spoofed to
  // evade per-client rate limits. Set TRUST_PROXY_HOPS only behind a known proxy.
  const proxyHops = parseTrustedProxyHops(process.env.TRUST_PROXY_HOPS);
  if (proxyHops > 0) app.set("trust proxy", proxyHops);

  // Anonymous abuse protection for every /api surface: sign-in and OAuth
  // callbacks, worker callbacks, anonymous reads and mutations. Health probes
  // are exempt, and static assets are never limited.
  app.use(createRateLimitMiddleware());

  // The callback route registers its own bounded JSON parser before its handler.
  // Production and HTTP tests share this exact route-registration function.
  registerAssessmentCallbackRoute(app);

  // Remaining application APIs share bounded body parsers.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "32kb", extended: false, parameterLimit: 100 }));

  // Liveness proves only that the process can answer HTTP requests.
  app.get("/api/health/live", (_req, res) => res.json({ status: "ok" }));

  // Readiness also verifies secrets/configuration, database connectivity, and
  // every table required for submissions, terms, evaluations, and audit history.
  // Keep /api/health as a backwards-compatible readiness check; it must not
  // report "ok" merely because the Node process started.
  const readinessHandler: express.RequestHandler = (_req, res, next) => {
    void checkPortalReadiness(process.env, async () => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured or unavailable.");
      await db.select().from(users).limit(0);
      await db.select().from(termsVersions).limit(0);
      await db.select().from(submissions).limit(0);
      await db.select().from(rubricVersions).limit(0);
      await db.select().from(validationResults).limit(0);
      await db.select().from(evaluations).limit(0);
      await db.select().from(decisions).limit(0);
      await db.select().from(withdrawals).limit(0);
      await db.select().from(automatedAssessmentRuns).limit(0);
      await db.select().from(portalAuditEvents).limit(0);
    }).then(result => {
      if (!result.ready) {
        // Only variable names or a generic probe label are logged—never values.
        console.warn("[Readiness] Portal is not ready:", result.missing);
        res.status(503).json({ status: "not_ready" });
        return;
      }
      res.status(200).json({ status: "ready" });
    }).catch(next);
  };
  app.get("/api/health", readinessHandler);
  app.get("/api/health/ready", readinessHandler);
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // Storage helpers hand clients `/manus-storage/<key>` links; without this
  // mount those links fall through to the SPA fallback and return HTML.
  registerStorageProxy(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Do not return parser stack traces or request contents to clients.
  app.use("/api", (error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) return next(error);
    const details = typeof error === "object" && error !== null
      ? error as { status?: unknown; statusCode?: unknown; type?: unknown }
      : {};
    const status = details.status === 413 || details.statusCode === 413 || details.type === "entity.too.large"
      ? 413
      : details.status === 400 || details.statusCode === 400 || details.type === "entity.parse.failed"
        ? 400
        : 500;
    res.status(status).json({
      error: status === 413
        ? "Request body exceeds the allowed limit."
        : status === 400
          ? "Invalid request body."
          : "Request could not be processed.",
    });
  });

  // Unknown API paths must not fall through to the SPA fallback below, which
  // would answer a client with HTML and HTTP 200 instead of a JSON 404.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => {
    console.error(describeOperationalFailure("server_runtime", error));
    process.exit(1);
  });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => {
  console.error(describeOperationalFailure("server_start", error));
  process.exit(1);
});
