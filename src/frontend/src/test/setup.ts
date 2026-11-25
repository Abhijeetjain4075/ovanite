import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

import { setRuntimeConfig } from "@/lib/runtimeConfigStore";

// Components read the actor from `BackendActorProvider`, which only mounts the
// Caffeine actor when the runtime contract names a canister. Seeding a canonical
// principal keeps every existing `useActor` mock on the connected code path; the
// disconnected gate itself is covered directly in `runtimeConfigStore.test.ts`.
setRuntimeConfig({ backend_canister_id: "ryjl3-tyaaa-aaaaa-aaaba-cai" });

// Generated components expose stable `data-ocid` hooks; use them only when no
// semantic query (role, label, text) can express the assertion.
configure({ testIdAttribute: "data-ocid" });

afterEach(() => {
  cleanup();
});
