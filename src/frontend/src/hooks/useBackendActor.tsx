import { useActor } from "@caffeineai/core-infrastructure";
import { Component, type ReactNode, createContext, useContext } from "react";

import { type Backend, createActor } from "@/backend";
import { isBackendConfigured } from "@/lib/runtimeConfigStore";

/**
 * Backend capability gate.
 *
 * `useActor` from the Caffeine SDK resolves `CANISTER_ID_BACKEND` inside its own
 * query and writes `console.error("CANISTER_ID_BACKEND is not set")` every time
 * it mounts. A deployment that intentionally runs without a canister therefore
 * produced that diagnostic on every page, which is noise in visitor consoles and
 * in browser-error telemetry.
 *
 * The fix is structural rather than cosmetic: the actor-owning component is only
 * rendered when the runtime contract actually names a canonical canister
 * principal. Rendering (not calling) a hook conditionally is legal, so the hook
 * order inside the connected provider stays stable, and a real canister
 * deployment takes exactly the previous code path.
 */
export type BackendActorState = {
  actor: Backend | null;
  isFetching: boolean;
};

const DISCONNECTED: BackendActorState = { actor: null, isFetching: false };

const BackendActorContext = createContext<BackendActorState>(DISCONNECTED);

function ConnectedBackendActorProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useActor(createActor);
  return (
    <BackendActorContext.Provider
      value={{ actor: actor ?? null, isFetching: Boolean(isFetching) }}
    >
      {children}
    </BackendActorContext.Provider>
  );
}

/**
 * A configured backend that cannot initialise (missing identity provider,
 * corrupt build, SDK failure) must not blank the public site. The boundary drops
 * the subtree to the disconnected state and the marketing pages keep working.
 */
class ActorFailureBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    console.debug(
      "[backend] actor unavailable; continuing without backend features.",
    );
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <BackendActorContext.Provider value={DISCONNECTED}>
          {this.props.children}
        </BackendActorContext.Provider>
      );
    }
    return this.props.children;
  }
}

export function BackendActorProvider({ children }: { children: ReactNode }) {
  if (!isBackendConfigured()) {
    return (
      <BackendActorContext.Provider value={DISCONNECTED}>
        {children}
      </BackendActorContext.Provider>
    );
  }
  return (
    <ActorFailureBoundary>
      <ConnectedBackendActorProvider>{children}</ConnectedBackendActorProvider>
    </ActorFailureBoundary>
  );
}

/** The actor for this deployment, or a permanently disconnected state. */
export function useBackendActor(): BackendActorState {
  return useContext(BackendActorContext);
}
