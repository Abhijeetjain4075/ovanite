import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {
  RUNTIME_CONFIG_PATH,
  findRuntimeConfigProblems,
  isLocalRuntimeHost,
  loadRuntimeConfig,
} from "./lib/runtimeConfig";
import { renderRuntimeConfigFailure } from "./lib/runtimeConfigFatal";

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
 * The runtime contract is fetched before the application mounts. A deployed
 * origin with a placeholder or malformed `env.json` fails loudly and visibly;
 * local development only warns, because it intentionally runs without a
 * deployed backend.
 */
async function start(): Promise<void> {
  const root = document.getElementById("root");
  if (!root) throw new Error("Application root element is missing.");

  const local = isLocalRuntimeHost(window.location.hostname);
  let problems: string[];

  try {
    problems = findRuntimeConfigProblems(await loadRuntimeConfig());
  } catch (error) {
    problems = [
      error instanceof Error
        ? error.message
        : `${RUNTIME_CONFIG_PATH} could not be loaded.`,
    ];
  }

  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`[runtime-config] ${problem}`);
    }
    if (!local) {
      renderRuntimeConfigFailure(root, problems);
      return;
    }
    console.warn(
      "[runtime-config] Local development continues without a deployed backend.",
    );
  }

  renderApplication(root);
}

void start().catch((error: unknown) => {
  console.error("[runtime-config] Application bootstrap failed.", error);
  const root = document.getElementById("root");
  if (root) {
    renderRuntimeConfigFailure(root, [
      "The application failed to start. See the console for details.",
    ]);
  }
});
