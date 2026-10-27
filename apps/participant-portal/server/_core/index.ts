import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { assessmentCallbackHandler } from "../portal/assessmentCallback";

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
    next();
  });
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "32kb", extended: false, parameterLimit: 100 }));

  // Isolated workers can post only schema-validated assessment summaries here.
  app.post("/api/assessment/callback", assessmentCallbackHandler);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);

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

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
