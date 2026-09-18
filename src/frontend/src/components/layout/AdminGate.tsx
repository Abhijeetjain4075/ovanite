import { Loader2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Container } from "@/components/layout/Container";
import { PrimaryButton } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/hooks/useAdmin";
import { useClaimOwner, useIsOwnerClaimed } from "@/hooks/useAdminTeam";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";

/** Turn a backend trap into a short, human message. */
function friendlyClaimError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/email is not the configured owner/i.test(raw)) {
    return "That email does not match the configured owner address.";
  }
  if (/signed-in caller required/i.test(raw)) {
    return "Sign in again to claim owner access.";
  }
  if (/not.?ready|backend/i.test(raw)) {
    return "The backend is not ready yet. Try again in a moment.";
  }
  return "Could not claim owner access. Please try again.";
}

/**
 * Gates admin routes: unauthenticated visitors are invited to sign in,
 * authenticated non-admins see the one-time owner claim while no owner exists,
 * and otherwise are told they lack access. Renders children only for admins.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, login, isLoggingIn } = useInternetIdentity();
  const { data: admin, isLoading } = useAdmin();
  const { data: isOwnerClaimed, isLoading: isClaimedLoading } =
    useIsOwnerClaimed();
  const claimOwner = useClaimOwner();

  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <Container className="py-24 md:py-32">
        <div className="mx-auto max-w-md text-center">
          <p className="eyebrow">Restricted</p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
            Admin access
          </h1>
          <p className="mt-4 text-muted-foreground">
            Sign in to manage products, FAQs, site copy, and submissions.
          </p>
          <Button
            type="button"
            size="lg"
            className="mt-8 rounded-sm"
            data-ocid="admin.login_button"
            onClick={() => login()}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </Container>
    );
  }

  if (isLoading || isClaimedLoading) {
    return (
      <Container className="py-24 md:py-32">
        <div
          data-ocid="admin.loading_state"
          className="flex items-center justify-center gap-3 text-muted-foreground"
        >
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
          <span>Checking access…</span>
        </div>
      </Container>
    );
  }

  if (!admin && isOwnerClaimed === false) {
    function handleClaim(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setFormError(null);
      const trimmed = email.trim();
      if (!trimmed) {
        setFormError("Enter the owner email address.");
        return;
      }
      claimOwner.mutate(trimmed, {
        onError: (error) => setFormError(friendlyClaimError(error)),
      });
    }

    return (
      <Container className="py-24 md:py-32">
        <div
          data-ocid="admin.claim_owner_panel"
          className="mx-auto max-w-md rounded-sm border border-border bg-card p-8"
        >
          <p className="eyebrow">One-time setup</p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
            Claim owner access
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            No owner has been set up yet. The first signed-in visitor whose
            email matches the configured owner address becomes the owner. This
            is a one-time step — once claimed, it cannot be repeated.
          </p>
          <form className="mt-6" onSubmit={handleClaim}>
            <Label htmlFor="owner-email" className="eyebrow">
              Owner email
            </Label>
            <Input
              id="owner-email"
              type="email"
              data-ocid="admin.claim_owner.email_input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@example.com"
              autoComplete="email"
              className="mt-2 rounded-sm"
              aria-invalid={formError ? true : undefined}
              aria-describedby={formError ? "owner-email-error" : undefined}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Must match the owner address configured for this deployment.
            </p>
            {formError ? (
              <p
                id="owner-email-error"
                data-ocid="admin.claim_owner.error_state"
                role="alert"
                className="mt-3 text-sm text-destructive"
              >
                {formError}
              </p>
            ) : null}
            <PrimaryButton
              type="submit"
              size="lg"
              className="mt-6 w-full"
              data-ocid="admin.claim_owner.submit_button"
              disabled={claimOwner.isPending}
            >
              {claimOwner.isPending ? (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              ) : (
                <ShieldCheck aria-hidden="true" className="mr-2 h-4 w-4" />
              )}
              Claim owner access
            </PrimaryButton>
          </form>
        </div>
      </Container>
    );
  }

  if (!admin) {
    return (
      <Container className="py-24 md:py-32">
        <div className="mx-auto max-w-md text-center">
          <p className="eyebrow">Restricted</p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
            Not authorised
          </h1>
          <p className="mt-4 text-muted-foreground">
            This account does not have admin access to Ovanite.
          </p>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="mt-8 rounded-sm"
          >
            <Link to="/" data-ocid="admin.back_home_link">
              Back to home
            </Link>
          </Button>
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
