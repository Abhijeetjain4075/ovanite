import { afterEach, describe, expect, it } from "vitest";

import {
  RUNTIME_CONFIG_ERROR_ATTRIBUTE,
  renderRuntimeConfigFailure,
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
});

describe("renderRuntimeConfigFailure", () => {
  it("replaces the app with an accessible failure panel", () => {
    const root = mountRoot();
    root.innerHTML = "<div id='app'>stale application</div>";

    renderRuntimeConfigFailure(root, ["backend_canister_id is unset"]);

    expect(root.querySelector("#app")).toBeNull();
    const alert = root.querySelector("[role='alert']");
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain("This deployment is not configured");
    expect(alert?.textContent).toContain("backend_canister_id is unset");
    expect(
      document.documentElement.dataset[RUNTIME_CONFIG_ERROR_ATTRIBUTE],
    ).toBe("invalid");
  });

  it("renders hostile text as text, never as markup", () => {
    const root = mountRoot();
    renderRuntimeConfigFailure(root, ["<img src=x onerror=alert(1)>"]);

    expect(root.querySelector("img")).toBeNull();
    expect(root.textContent).toContain("<img src=x onerror=alert(1)>");
  });
});
