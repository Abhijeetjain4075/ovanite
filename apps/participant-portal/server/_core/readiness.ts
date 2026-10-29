export type PortalRuntimeEnv = Record<string, string | undefined>;

export type PortalReadinessResult = {
  ready: boolean;
  missing: string[];
};

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasValidHttpsUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function hasValidMysqlUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "mysql:" || parsed.protocol === "mysql2:") &&
      Boolean(parsed.hostname) &&
      Boolean(parsed.pathname.replace(/^\//, ""))
    );
  } catch {
    return false;
  }
}

/**
 * Returns the names—not values—of critical settings that prevent production
 * readiness. Never log or return environment values, since they include
 * session-signing and database credentials.
 */
export function missingPortalRuntimeConfig(
  env: PortalRuntimeEnv = process.env,
): string[] {
  const missing: string[] = [];

  if (!clean(env.MANUS_PROJECT_ID)) missing.push("MANUS_PROJECT_ID");
  if (!clean(env.OWNER_OPEN_ID)) missing.push("OWNER_OPEN_ID");
  if (clean(env.MANUS_JWT_SECRET).length < 32) {
    missing.push("MANUS_JWT_SECRET (must be at least 32 characters)");
  }
  if (!hasValidHttpsUrl(clean(env.MANUS_OAUTH_API_URL))) {
    missing.push("MANUS_OAUTH_API_URL (must be an absolute HTTPS URL)");
  }
  if (!hasValidMysqlUrl(clean(env.DATABASE_URL))) {
    missing.push("DATABASE_URL (must be a valid MySQL connection URL)");
  }

  return missing;
}

/**
 * A service is ready only when all required configuration is present and a
 * database probe confirms that the core tables exist. Probe failures are
 * represented as a generic readiness failure; callers must not return the
 * original exception, SQL, hostname, or connection string to the visitor.
 */
export async function checkPortalReadiness(
  env: PortalRuntimeEnv,
  probeDatabase: () => Promise<void>,
): Promise<PortalReadinessResult> {
  const missing = missingPortalRuntimeConfig(env);
  if (missing.length > 0) return { ready: false, missing };

  try {
    await probeDatabase();
    return { ready: true, missing: [] };
  } catch {
    return { ready: false, missing: ["DATABASE_CONNECTIVITY_OR_SCHEMA"] };
  }
}
