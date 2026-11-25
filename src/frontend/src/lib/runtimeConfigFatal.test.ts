import { afterEach, describe, expect, it, vi } from "vitest";

import {
  RUNTIME_CONFIG_ERROR_ATTRIBUTE,
  markRuntimeConfigDegraded,
  renderStartupFailure,
} from "./runtimeConfigFatal";

function mountRoot(): HTMLElement {
  const root = document.createElement("div");
  root.id = "root";
  document.body.append(root);
  return root;
}

afterEach(() => {
  document.body.replaceChildren();
  delete document.documentElement.dataset[RUNTIME_CONFIG_ERROR_ATTRIBUTE];
  vi.restoreAllMocks();
});

describe("markRuntimeConfigDegraded", () => {
  it("marks the document and logs every problem without touching the page", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const root = mountRoot();
    root.innerHTML = "<div id='app'>rendered application</div>";

    markRuntimeConfigDegraded(["backend_canister_id is unset"], {
      local: false,
    });

    expect(
      document.documentElement.dataset[RUNTIME_CONFIG_ERROR_ATTRIBUTE],
    ).toBe("degraded");
    expect(error).toHaveBeenCalledWith(
      "[runtime-config] backend_canister_id is unset",
    );
    expect(warn).toHaveBeenCalled();
    expect(root.querySelector("#app")?.textContent).toBe(
      "rendered application",
    );
  });
});

describe("renderStartupFailure", () => {
  it("shows a recovery message with no operator detail", () => {
    const root = mountRoot();
    root.innerHTML = "<div id='app'>stale application</div>";

    renderStartupFailure(root);

    expect(root.querySelector("#app")).toBeNull();
    const alert = root.querySelector("[role='alert']");
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain("This page did not load");
    expect(
      root.querySelector("[data-ocid='startup-failure.reload_button']"),
    ).not.toBeNull();
    // The failure surface is public HTML: no environment, canister or
    // configuration vocabulary may appear in it.
    expect(root.textContent ?? "").not.toMatch(
      /canister|env\.json|deployment config|operator|runtime configuration/i,
    );
    expect(
      document.documentElement.dataset[RUNTIME_CONFIG_ERROR_ATTRIBUTE],
    ).toBe("failed");
  });
});
