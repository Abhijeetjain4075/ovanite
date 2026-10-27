// Platform values are read at use time. See the Webdev service/authentication skills.
export const ENV = {
  get appId() { return process.env.MANUS_PROJECT_ID ?? ""; },
  get cookieSecret() { return process.env.MANUS_JWT_SECRET ?? ""; },
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
  get oAuthServerUrl() { return process.env.MANUS_OAUTH_API_URL ?? ""; },
  // Preserve the legacy hint when supplied; otherwise roles remain application data.
  get ownerOpenId() { return process.env.OWNER_OPEN_ID ?? ""; },
  get isProduction() { return process.env.NODE_ENV === "production"; },
  get forgeApiUrl() { return process.env.MANUS_API_URL ?? ""; },
  get forgeApiKey() { return process.env.MANUS_API_KEY ?? ""; },
  // Fine-grained token restricted to Actions: write on this repository; never expose to clients.
  get assessmentGitHubToken() { return process.env.OVANITE_GITHUB_ACTIONS_TOKEN ?? ""; },
  // Must match the GitHub repository secret used by the static-assessment workflow.
  get assessmentCallbackSecret() { return process.env.OVANITE_ASSESSMENT_CALLBACK_SECRET ?? ""; },
  // Public base URL of the deployed participant portal, not the marketing site unless co-hosted.
  get assessmentPortalBaseUrl() { return process.env.OVANITE_ASSESSMENT_PORTAL_BASE_URL ?? ""; },
  get assessmentWorkflowRef() { return process.env.OVANITE_ASSESSMENT_WORKFLOW_REF ?? "main"; },
};
