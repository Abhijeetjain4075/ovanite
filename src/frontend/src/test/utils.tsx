import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import type { backendInterface } from "@/backend";

/**
 * A typed stand-in for the generated backend actor. Every method is a Vitest
 * mock so a test can assert the exact call the UI made, and any method a test
 * does not configure rejects loudly instead of silently resolving `undefined`.
 *
 * This is a local mock: it proves the frontend's consumer contract, never the
 * real canister. See the suite's coverage limits.
 */
export type MockActor = {
  [K in keyof backendInterface]: ReturnType<typeof vi.fn>;
};

export function createMockActor(overrides: Partial<MockActor> = {}): MockActor {
  const actor = new Proxy(
    {},
    {
      get(target: Record<string, unknown>, property: string) {
        if (!(property in target)) {
          target[property] = vi.fn(() =>
            Promise.reject(
              new Error(`MockActor.${property} was not configured`),
            ),
          );
        }
        return target[property];
      },
    },
  ) as MockActor;
  return Object.assign(actor, overrides);
}

/**
 * The `useActor` return shape from `@caffeineai/core-infrastructure`. Tests
 * mock that module and return this so hooks resolve against the local actor.
 */
export function actorResult(actor: MockActor | null) {
  return { actor, isFetching: false };
}

type ProvidersOptions = {
  /** Initial router entry; defaults to the home route. */
  route?: string;
};

function Providers({
  children,
  route = "/",
}: {
  children: ReactNode;
  route?: string;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

/** Render a component inside the app's real providers with a fresh query cache. */
export function renderWithProviders(
  ui: ReactElement,
  { route }: ProvidersOptions = {},
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) => <Providers route={route}>{children}</Providers>,
    ...options,
  });
}
