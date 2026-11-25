import {
  type InternetIdentityContext,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
import { Component, type ReactNode, createContext, useContext } from "react";

import { isBackendConfigured } from "@/lib/runtimeConfigStore";

/**
 * Identity capability gate.
 *
 * `InternetIdentityProvider` resolves the canister binding while it mounts and
 * writes `console.error("CANISTER_ID_BACKEND is not set")` when the deployment
 * has no canister. Sign-in is pointless without a backend to authorise against,
 * so the provider is only mounted when the runtime contract names one. Pages read
 * identity through `useIdentity`, which then yields a stable anonymous value.
 *
 * Rendering — not calling — a hook conditionally keeps the hook order inside each
 * component stable, and a real deployment takes exactly the previous code path.
 */
const ANONYMOUS: InternetIdentityContext = {
  identity: undefined,
  login: () => {},
  clear: () => {},
  loginStatus: "idle",
  isInitializing: false,
  isLoginIdle: true,
  isLoggingIn: false,
  isLoginSuccess: false,
  isLoginError: false,
  isAuthenticated: false,
};

const IdentityContext = createContext<InternetIdentityContext>(ANONYMOUS);

function ConnectedIdentityProvider({ children }: { children: ReactNode }) {
  const value = useInternetIdentity();
  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

/** A backend that cannot initialise must not blank the site. */
class IdentityFailureBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    console.debug(
      "[identity] sign-in unavailable; continuing without authentication.",
    );
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <IdentityContext.Provider value={ANONYMOUS}>
          {this.props.children}
        </IdentityContext.Provider>
      );
    }
    return this.props.children;
  }
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  if (!isBackendConfigured()) {
    return (
      <IdentityContext.Provider value={ANONYMOUS}>
        {children}
      </IdentityContext.Provider>
    );
  }
  return (
    <IdentityFailureBoundary>
      <ConnectedIdentityProvider>{children}</ConnectedIdentityProvider>
    </IdentityFailureBoundary>
  );
}

/** The identity context for this deployment, anonymous when unconfigured. */
export function useIdentity(): InternetIdentityContext {
  return useContext(IdentityContext);
}
