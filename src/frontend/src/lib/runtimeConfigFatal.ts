/**
 * Startup diagnostics and the last-resort visitor failure surface.
 *
 * A release with an unusable runtime contract is an operator problem, never a
 * visitor-facing one. The public page therefore stays neutral: the full detail
 * goes to the console and to a document marker that synthetic monitoring and
 * the E2E lane can assert on, while the visitor sees a short recovery message
 * with no environment, canister, or deployment vocabulary.
 *
 * Everything here is built with `textContent`, so hostile markup cannot be
 * injected through a failure message.
 */
export const RUNTIME_CONFIG_ERROR_ATTRIBUTE = "runtimeConfigError";

/** Record a degraded (still rendering) runtime contract and log every problem. */
export function markRuntimeConfigDegraded(
  problems: readonly string[],
  { local }: { local: boolean },
): void {
  document.documentElement.dataset[RUNTIME_CONFIG_ERROR_ATTRIBUTE] = "degraded";
  for (const problem of problems) {
    console.error(`[runtime-config] ${problem}`);
  }
  console.warn(
    local
      ? "[runtime-config] Local development continues without a deployed backend."
      : "[runtime-config] Rendering the site without backend features; see the errors above.",
  );
}

/**
 * The application could not mount at all. This is the only case where the
 * visitor is shown a failure surface, and it deliberately contains no operator
 * detail: an environment name or a configuration key in public HTML is an
 * information leak, and it does not help the person looking at the page.
 */
export function renderStartupFailure(root: HTMLElement): void {
  document.documentElement.dataset[RUNTIME_CONFIG_ERROR_ATTRIBUTE] = "failed";

  const container = document.createElement("main");
  container.setAttribute("role", "alert");
  container.setAttribute("data-ocid", "startup-failure");
  container.style.cssText = [
    "max-width:32rem",
    "margin:6rem auto",
    "padding:0 1.5rem",
    "font-family:ui-sans-serif,system-ui,sans-serif",
    "line-height:1.6",
    "color:#1f2937",
    "text-align:center",
  ].join(";");

  const title = document.createElement("h1");
  title.style.cssText = "font-size:1.25rem;margin:0 0 0.75rem";
  title.textContent = "This page did not load";

  const body = document.createElement("p");
  body.style.cssText = "margin:0 0 1.5rem;color:#4b5563";
  body.textContent =
    "Something interrupted loading. Reloading the page usually fixes it.";

  const reload = document.createElement("button");
  reload.type = "button";
  reload.textContent = "Reload";
  reload.setAttribute("data-ocid", "startup-failure.reload_button");
  reload.style.cssText = [
    "font:inherit",
    "cursor:pointer",
    "border:1px solid #1f2937",
    "border-radius:2px",
    "padding:0.6rem 1.2rem",
    "background:#1f2937",
    "color:#ffffff",
  ].join(";");
  reload.addEventListener("click", () => window.location.reload());

  container.append(title, body, reload);
  root.replaceChildren(container);
}
