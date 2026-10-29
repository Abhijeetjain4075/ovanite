/**
 * Public submissions require an explicit release switch independent of backend
 * reachability. A healthy backend alone is not enough evidence that persistence,
 * abuse controls, privacy handling, and support operations are production-ready.
 */
export function configurePublicFormsActivation(env = process.env) {
  const enabled =
    typeof env.OVANITE_PUBLIC_FORMS_ENABLED === "string" &&
    env.OVANITE_PUBLIC_FORMS_ENABLED.trim().toLowerCase() === "true";

  // Vite exposes VITE_* values to the browser bundle. Default to the closed
  // state in local, preview, and production builds unless explicitly enabled.
  env.VITE_PUBLIC_FORMS_ENABLED = enabled ? "true" : "false";
  return enabled;
}
