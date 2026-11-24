import express, { type Express } from "express";
import { assessmentCallbackHandler } from "./assessmentCallback";

/**
 * Register the callback with its own bounded JSON parser. The production server
 * and HTTP tests use this exact function, preventing parser/route-order drift.
 */
export function registerAssessmentCallbackRoute(app: Express): void {
  app.post(
    "/api/assessment/callback",
    express.json({ limit: "1mb", strict: true }),
    (req, res, next) => {
      void assessmentCallbackHandler(req, res).catch(next);
    },
  );

  // Keep parser failures bounded and sanitized even when this route is mounted
  // by a minimal test host. The main server has a corresponding /api fallback.
  app.use("/api/assessment/callback", (error: unknown, _req, res, next) => {
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
}
