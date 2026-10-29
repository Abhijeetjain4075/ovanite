import { Fingerprint, Loader2, LogIn, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export const CANONICAL_OVANITE_ORIGIN = "https://ovanite.vercel.app";

export function isCanonicalOvaniteOrigin(origin: string): boolean {
  return origin === CANONICAL_OVANITE_ORIGIN;
}

type IdentityCheckProps = {
  /** Dependency seam for deterministic origin tests; the routed page uses window.location.origin. */
  currentOrigin?: string;
};

/**
 * Helps the operator read the Internet Identity principal for the canonical
 * production origin before a backend canister exists. It never calls the
 * backend and must not be used from a Vercel preview origin.
 */
export default function IdentityCheck({
  currentOrigin = window.location.origin,
}: IdentityCheckProps) {
  const {
    identity,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    login,
    isLoginError,
  } = useInternetIdentity();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "unavailable">(
    "idle",
  );

  const onCanonicalOrigin = isCanonicalOvaniteOrigin(currentOrigin);
  const principalObject = identity?.getPrincipal();
  const isAnonymousIdentity = principalObject?.isAnonymous() ?? false;
  // Never present the anonymous principal as a valid owner candidate.
  const principal = isAnonymousIdentity ? undefined : principalObject?.toText();

  async function copyPrincipal() {
    if (!principal || !navigator.clipboard?.writeText) {
      setCopyState("unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(principal);
      setCopyState("copied");
    } catch {
      setCopyState("unavailable");
    }
  }

  return (
    <>
      <PageMeta
        title="Identity setup check"
        description="A restricted setup utility for checking the Internet Identity principal associated with Ovanite's canonical production origin."
      />
      <Container className="py-20 md:py-28">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
              00
            </span>
            <span className="eyebrow">Deployment diagnostics</span>
          </div>

          <h1 className="mt-8 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Identity setup check
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            This utility reads the Internet Identity principal from the current
            browser session. It does not call the backend, grant access, or
            submit the identifier anywhere.
          </p>

          {!onCanonicalOrigin ? (
            <section
              className="mt-8 border border-border bg-card p-6"
              data-ocid="identity.origin_warning"
              aria-live="polite"
            >
              <ShieldAlert
                aria-hidden="true"
                className="h-5 w-5 text-primary"
              />
              <h2 className="mt-4 font-display text-xl font-semibold">
                Open the canonical production domain
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Preview deployments and alternate domains can derive a different
                principal. For Ovanite's production owner setup, open this
                utility on the canonical domain only.
              </p>
              <a
                className="mt-5 inline-flex text-sm font-medium underline underline-offset-4"
                href={`${CANONICAL_OVANITE_ORIGIN}/identity-check`}
                data-ocid="identity.canonical_link"
              >
                Open Ovanite production identity check
              </a>
            </section>
          ) : isInitializing ? (
            <div
              className="mt-8 flex items-center gap-3 border border-border bg-card p-6 text-sm text-muted-foreground"
              data-ocid="identity.initializing_state"
              aria-live="polite"
            >
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Restoring the local identity session…
            </div>
          ) : !isAuthenticated || !principal ? (
            <section className="mt-8 border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">
                Sign in to view your principal
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Use the same Internet Identity method that you intend to use for
                Ovanite administration. Sign-in alone does not grant admin
                privileges.
              </p>
              {isLoginError ? (
                <p
                  className="mt-4 text-sm text-destructive"
                  data-ocid="identity.login_error"
                  role="alert"
                >
                  Sign-in did not complete. Retry and finish the Internet
                  Identity flow in the opened window.
                </p>
              ) : null}
              <Button
                type="button"
                size="lg"
                className="mt-6 rounded-sm"
                data-ocid="identity.login_button"
                onClick={() => login()}
                disabled={isLoggingIn}
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                {isLoggingIn ? "Signing in…" : "Sign in with Internet Identity"}
              </Button>
            </section>
          ) : (
            <section
              className="mt-8 border border-border bg-card p-6"
              data-ocid="identity.principal_panel"
            >
              <div className="flex items-center gap-3">
                <Fingerprint
                  aria-hidden="true"
                  className="h-5 w-5 text-primary"
                />
                <h2 className="font-display text-xl font-semibold">
                  Your Ovanite-origin principal
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This is the public principal identifier reported by the
                authenticated session on {CANONICAL_OVANITE_ORIGIN}. It is not a
                password or private key.
              </p>
              <output
                className="mt-5 block break-all rounded-sm border border-border bg-background p-4 font-mono text-sm"
                data-ocid="identity.principal_value"
                aria-label="Internet Identity principal"
              >
                {principal}
              </output>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-sm"
                data-ocid="identity.copy_button"
                onClick={() => void copyPrincipal()}
              >
                {copyState === "copied" ? "Copied" : "Copy principal"}
              </Button>
              <p
                className="mt-3 text-sm text-muted-foreground"
                data-ocid="identity.copy_status"
                aria-live="polite"
              >
                {copyState === "copied"
                  ? "Principal copied to clipboard."
                  : copyState === "unavailable"
                    ? "Clipboard is unavailable here. Select the principal above and copy it manually."
                    : "Share only this principal identifier when configuring the backend owner. Never share a seed phrase, recovery phrase, private key, or delegation."}
              </p>
            </section>
          )}

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            Production is still backend-unconfigured. This page is diagnostic
            only and does not create a canister, configure ownership, or enable
            public submissions.
          </p>
        </div>
      </Container>
    </>
  );
}
