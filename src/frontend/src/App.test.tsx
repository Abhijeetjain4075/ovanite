import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { actorResult, createMockActor } from "@/test/utils";

const { useActorMock, useInternetIdentityMock } = vi.hoisted(() => ({
  useActorMock: vi.fn(),
  useInternetIdentityMock: vi.fn(),
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
  useInternetIdentity: useInternetIdentityMock,
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: vi.fn() };
});

import App from "@/App";

function renderAppAt(path: string) {
  window.history.pushState({}, "", path);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe("App routing", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    useInternetIdentityMock.mockReset();
    useInternetIdentityMock.mockReturnValue({
      isAuthenticated: false,
      login: vi.fn(),
      isLoggingIn: false,
    });
    const actor = createMockActor();
    actor.getSiteContent.mockResolvedValue({ updatedAt: 0n });
    actor.listPublishedProducts.mockResolvedValue([]);
    actor.listPublishedFaqs.mockResolvedValue([]);
    actor.getCallerAdmin.mockResolvedValue(null);
    actor.isOwnerClaimed.mockResolvedValue(true);
    useActorMock.mockReturnValue(actorResult(actor));
  });

  it("renders the home page on the default route", async () => {
    renderAppAt("/");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Software, built to matter.",
      }),
    ).toBeInTheDocument();
  });

  it("renders the custom 404 page for an unknown route", async () => {
    renderAppAt("/definitely-not-a-route");

    expect(
      await screen.findByRole("heading", {
        name: "This page doesn’t exist.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("not_found.home_button")).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByTestId("not_found.products_button")).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("renders the Products page with its empty state", async () => {
    renderAppAt("/products");

    expect(
      await screen.findByTestId("products.empty_state"),
    ).toBeInTheDocument();
  });

  it("renders the About page with editable copy", async () => {
    renderAppAt("/about");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "A software company, not a service.",
      }),
    ).toBeInTheDocument();
  });

  it("renders the Privacy page with editable legal copy", async () => {
    renderAppAt("/privacy");

    expect(
      await screen.findByRole("heading", { name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ovanite collects only the information/),
    ).toBeInTheDocument();
  });

  it("renders the Terms page with editable legal copy", async () => {
    renderAppAt("/terms");

    expect(
      await screen.findByRole("heading", { name: "Terms of Use" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This website is provided for general information/),
    ).toBeInTheDocument();
  });

  it("renders the Contact page with its form", async () => {
    renderAppAt("/contact");

    expect(
      await screen.findByRole("heading", { name: "Start a conversation." }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("contact.form")).toBeInTheDocument();
  });

  it("renders the Waitlist page with its form", async () => {
    renderAppAt("/waitlist");

    expect(
      await screen.findByRole("heading", { name: "Join the waitlist." }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("waitlist.form")).toBeInTheDocument();
  });

  it("renders the Thank You page on its own route", async () => {
    renderAppAt("/thank-you");

    expect(
      await screen.findByRole("heading", {
        name: "Thank you for reaching out.",
      }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs on inner pages and none on Home", async () => {
    renderAppAt("/about");

    expect(
      await screen.findByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();

    cleanup();
    renderAppAt("/");

    await screen.findByRole("heading", {
      level: 1,
      name: "Software, built to matter.",
    });
    expect(
      screen.queryByRole("navigation", { name: "Breadcrumb" }),
    ).not.toBeInTheDocument();
  });
});
