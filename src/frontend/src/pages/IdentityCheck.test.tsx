import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useInternetIdentityMock } = vi.hoisted(() => ({
  useInternetIdentityMock: vi.fn(),
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: useInternetIdentityMock,
}));

import IdentityCheck, {
  CANONICAL_OVANITE_ORIGIN,
  isCanonicalOvaniteOrigin,
} from "@/pages/IdentityCheck";
import { renderWithProviders } from "@/test/utils";

function unauthenticated(overrides: Record<string, unknown> = {}) {
  return {
    identity: undefined,
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    isLoginError: false,
    ...overrides,
  };
}

describe("IdentityCheck", () => {
  beforeEach(() => {
    useInternetIdentityMock.mockReset();
  });

  it("recognizes only the canonical production origin", () => {
    expect(isCanonicalOvaniteOrigin(CANONICAL_OVANITE_ORIGIN)).toBe(true);
    expect(isCanonicalOvaniteOrigin("https://preview.example.test")).toBe(
      false,
    );
    expect(isCanonicalOvaniteOrigin("http://ovanite.vercel.app")).toBe(false);
  });

  it("refuses to show a principal on a preview or alternate origin", () => {
    useInternetIdentityMock.mockReturnValue(
      unauthenticated({
        isAuthenticated: true,
        identity: { getPrincipal: () => ({ toText: () => "test-principal" }) },
      }),
    );

    renderWithProviders(
      <IdentityCheck currentOrigin="https://preview.example.test" />,
    );

    expect(screen.getByTestId("identity.origin_warning")).toBeInTheDocument();
    expect(screen.queryByText("test-principal")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /canonical production identity check/i,
      }),
    ).toHaveAttribute("href", `${CANONICAL_OVANITE_ORIGIN}/identity-check`);
  });

  it("offers sign-in on the canonical origin without requiring a backend actor", async () => {
    const auth = unauthenticated();
    useInternetIdentityMock.mockReturnValue(auth);

    renderWithProviders(
      <IdentityCheck currentOrigin={CANONICAL_OVANITE_ORIGIN} />,
    );

    const button = screen.getByRole("button", {
      name: /sign in with internet identity/i,
    });
    fireEvent.click(button);

    await waitFor(() => expect(auth.login).toHaveBeenCalledTimes(1));
  });

  it("shows the authenticated principal without calling the backend", () => {
    useInternetIdentityMock.mockReturnValue(
      unauthenticated({
        isAuthenticated: true,
        identity: { getPrincipal: () => ({ toText: () => "2vxsx-fae" }) },
      }),
    );

    renderWithProviders(
      <IdentityCheck currentOrigin={CANONICAL_OVANITE_ORIGIN} />,
    );

    expect(screen.getByTestId("identity.principal_value")).toHaveTextContent(
      "2vxsx-fae",
    );
    expect(
      screen.queryByRole("button", { name: /claim owner access/i }),
    ).not.toBeInTheDocument();
  });

  it("copies only the public principal identifier and confirms success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    useInternetIdentityMock.mockReturnValue(
      unauthenticated({
        isAuthenticated: true,
        identity: { getPrincipal: () => ({ toText: () => "2vxsx-fae" }) },
      }),
    );

    renderWithProviders(
      <IdentityCheck currentOrigin={CANONICAL_OVANITE_ORIGIN} />,
    );

    fireEvent.click(screen.getByTestId("identity.copy_button"));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("2vxsx-fae"));
    expect(await screen.findByTestId("identity.copy_status")).toHaveTextContent(
      "Principal copied to clipboard.",
    );
  });
});
