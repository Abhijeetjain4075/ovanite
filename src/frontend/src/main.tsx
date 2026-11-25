import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {
  RUNTIME_CONFIG_PATH,
  type RuntimeConfig,
  findRuntimeConfigProblems,
  isLocalRuntimeHost,
  loadRuntimeConfig,
} from "./lib/runtimeConfig";
import {
  markRuntimeConfigDegraded,
  renderStartupFailure,
} from "./lib/runtimeConfigFatal";
import { setRuntimeConfig } from "./lib/runtimeConfigStore";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient();

function renderApplication(root: HTMLElement) {
  ReactDOM.createRoot(root).render(
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <App />
      </InternetIdentityProvider>
    </QueryClientProvider>,
  );
}

/**
 * The runtime contract is fetched before the application mounts.
 *
 * An unusable contract is a release defect, but it is not a reason to replace
 * the public site with an operator checklist. The application still renders:
 * every backend-dependent feature (site copy, forms, admin, sign-in) already has
 * an explicit unavailable or closed state, so visitors get the marketing site
 * with those features switched off while the operators get a loud console trail
 * and a monitoring marker. Local development behaves the same way.
 */
async function start(): Promise<void> {
  const root = document.getElementById("root");
  if (!root) throw new Error("Application root element is missing.");

  const local = isLocalRuntimeHost(window.location.hostname);

  let config: RuntimeConfig = {};
  let problems: string[];
  try {
    config = await loadRuntimeConfig();
    problems = findRuntimeConfigProblems(config);
  } catch (error) {
    problems = [
      error instanceof Error
        ? error.message
        : `${RUNTIME_CONFIG_PATH} could not be loaded.`,
    ];
  }
  setRuntimeConfig(config);

  if (problems.length > 0) {
    markRuntimeConfigDegraded(problems, { local });
  }

  renderApplication(root);
}

void start().catch((error: unknown) => {
  console.error("[bootstrap] Application bootstrap failed.", error);
  const root = document.getElementById("root");
  if (root) renderStartupFailure(root);
});
