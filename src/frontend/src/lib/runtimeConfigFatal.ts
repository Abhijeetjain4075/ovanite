/**
 * Visible failure surface for an unusable runtime configuration.
 *
 * Shipping a bundle that cannot reach the backend is a release incident, not a
 * degraded mode: the page must say so instead of rendering an application whose
 * every data call fails mysteriously. Everything here is built with
 * `textContent`, so a hostile `env.json` cannot inject markup.
 */
export const RUNTIME_CONFIG_ERROR_ATTRIBUTE = "runtimeConfigError";

export function renderRuntimeConfigFailure(
  root: HTMLElement,
  problems: readonly string[],
): void {
  document.documentElement.dataset[RUNTIME_CONFIG_ERROR_ATTRIBUTE] = "invalid";

  const container = document.createElement("main");
  container.setAttribute("role", "alert");
  container.setAttribute("data-ocid", "runtime-config-error");
  container.style.cssText = [
    "max-width:44rem",
    "margin:4rem auto",
    "padding:1.5rem 2rem",
    "font-family:ui-sans-serif,system-ui,sans-serif",
    "line-height:1.5",
    "color:#1f2937",
  ].join(";");

  const title = document.createElement("h1");
  title.style.cssText = "font-size:1.5rem;margin:0 0 1rem";
  title.textContent = "This deployment is not configured";

  const summary = document.createElement("p");
  summary.style.cssText = "margin:0 0 1rem";
  summary.textContent =
    "The application cannot start because its runtime configuration is incomplete. The operator must finish the deployment configuration and publish a new build.";

  const list = document.createElement("ul");
  list.style.cssText = "margin:0 0 1rem;padding-left:1.25rem";
  for (const problem of problems) {
    const item = document.createElement("li");
    item.textContent = problem;
    list.append(item);
  }

  const contact = document.createElement("p");
  contact.style.cssText = "margin:0";
  contact.textContent =
    "Reference: frontend runtime configuration (env.json). No data has been submitted.";

  container.append(title, summary, list, contact);
  root.replaceChildren(container);
}
