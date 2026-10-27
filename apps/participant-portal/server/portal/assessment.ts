import { ENV } from "../_core/env";

export const ASSESSMENT_WORKFLOW_PATH = ".github/workflows/candidate-static-assessment.yml";
export const ASSESSMENT_PIPELINE_VERSION = "static-v1";
const repositoryOwner = "Abhijeetjain4075";
const repositoryName = "ovanite";
const apiHeaders = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "Ovanite-Participant-Assessment/1.0",
};

export class AssessmentDispatchError extends Error {
  constructor(
    readonly code: "repository_unavailable" | "repository_not_public" | "revision_unavailable" | "github_rate_limited" | "github_dispatch_rejected" | "github_network_error",
    message: string,
  ) {
    super(message);
    this.name = "AssessmentDispatchError";
  }
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

/** Resolve a public GitHub repository's default branch to an immutable commit SHA.
 * All outbound requests target the fixed api.github.com origin; submitted URLs are never fetched.
 */
export async function resolvePublicGitHubRevision(fullName: string): Promise<{ branch: string; sha: string }> {
  const parts = fullName.split("/");
  if (parts.length !== 2 || parts.some(part => !/^[A-Za-z0-9_.-]{1,100}$/.test(part))) {
    throw new AssessmentDispatchError("repository_unavailable", "Only public GitHub repositories with a valid owner/name are supported.");
  }
  const [owner, name] = parts;
  try {
    const repoResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
      headers: apiHeaders,
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (repoResponse.status === 403 || repoResponse.status === 429) {
      throw new AssessmentDispatchError("github_rate_limited", "GitHub temporarily limited metadata requests. Retry later.");
    }
    if (repoResponse.status === 404) {
      throw new AssessmentDispatchError("repository_unavailable", "The repository is unavailable or is not public.");
    }
    if (!repoResponse.ok) {
      throw new AssessmentDispatchError("repository_unavailable", "GitHub could not verify this repository.");
    }
    const repoData = objectValue(await repoResponse.json());
    if (!repoData || repoData.private !== false || repoData.archived === true || repoData.disabled === true) {
      throw new AssessmentDispatchError("repository_not_public", "Only active public GitHub repositories can be assessed.");
    }
    const branch = repoData.default_branch;
    if (typeof branch !== "string" || !branch || branch.length > 255 || branch.startsWith("-") || branch.includes("\\") || branch.includes("..")) {
      throw new AssessmentDispatchError("revision_unavailable", "GitHub returned an unsupported default branch name.");
    }
    const commitUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits/${encodeURIComponent(branch)}`;
    const commitResponse = await fetch(commitUrl, {
      headers: apiHeaders,
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (commitResponse.status === 403 || commitResponse.status === 429) {
      throw new AssessmentDispatchError("github_rate_limited", "GitHub temporarily limited revision requests. Retry later.");
    }
    if (!commitResponse.ok) {
      throw new AssessmentDispatchError("revision_unavailable", "Could not resolve the repository's default branch to a commit.");
    }
    const commitData = objectValue(await commitResponse.json());
    const sha = commitData?.sha;
    if (typeof sha !== "string" || !/^[a-f0-9]{40}$/i.test(sha)) {
      throw new AssessmentDispatchError("revision_unavailable", "GitHub did not return a valid immutable commit SHA.");
    }
    return { branch, sha: sha.toLowerCase() };
  } catch (error) {
    if (error instanceof AssessmentDispatchError) throw error;
    throw new AssessmentDispatchError("github_network_error", "GitHub could not be reached safely. Retry the assessment later.");
  }
}

export async function dispatchStaticAssessment(input: {
  runId: string;
  submissionId: string;
  repository: string;
  sha: string;
  branch: string;
}): Promise<void> {
  if (!ENV.assessmentGitHubToken || !ENV.assessmentCallbackSecret || !ENV.assessmentPortalBaseUrl) {
    throw new AssessmentDispatchError(
      "github_dispatch_rejected",
      "Automated assessment is not configured. An operator must configure the GitHub Actions token, callback secret, and deployed portal URL.",
    );
  }
  let portalUrl: URL;
  try {
    portalUrl = new URL(ENV.assessmentPortalBaseUrl);
  } catch {
    throw new AssessmentDispatchError("github_dispatch_rejected", "The configured assessment portal URL is invalid.");
  }
  if (portalUrl.protocol !== "https:" || portalUrl.username || portalUrl.password || portalUrl.search || portalUrl.hash) {
    throw new AssessmentDispatchError("github_dispatch_rejected", "The configured assessment portal URL must be a clean HTTPS origin/path.");
  }
  const workflowRef = ENV.assessmentWorkflowRef;
  if (!/^[A-Za-z0-9_.\/-]{1,255}$/.test(workflowRef) || workflowRef.startsWith("-") || workflowRef.includes("..")) {
    throw new AssessmentDispatchError("github_dispatch_rejected", "The configured assessment workflow ref is invalid.");
  }
  const endpoint = `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/actions/workflows/candidate-static-assessment.yml/dispatches`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...apiHeaders,
        Authorization: `Bearer ${ENV.assessmentGitHubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: workflowRef,
        inputs: {
          candidate_repository: input.repository,
          candidate_sha: input.sha,
          candidate_default_branch: input.branch,
          portal_submission_id: input.submissionId,
          assessment_run_id: input.runId,
        },
      }),
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (response.status === 204) return;
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      throw new AssessmentDispatchError("github_dispatch_rejected", "GitHub rejected the workflow dispatch. Verify token permissions and that the workflow exists on the configured ref.");
    }
    throw new AssessmentDispatchError("github_dispatch_rejected", "GitHub did not accept the workflow dispatch.");
  } catch (error) {
    if (error instanceof AssessmentDispatchError) throw error;
    throw new AssessmentDispatchError("github_network_error", "The assessment workflow could not be reached. The run was not started.");
  }
}

export function assessmentWorkflowUrl(): string {
  return `https://github.com/${repositoryOwner}/${repositoryName}/actions/workflows/candidate-static-assessment.yml`;
}
