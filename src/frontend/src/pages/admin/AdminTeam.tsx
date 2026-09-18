import { Principal } from "@icp-sdk/core/principal";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";

import { AdminTeamList } from "@/components/admin/AdminTeamList";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { MicroBadge, PrimaryButton } from "@/components/shared/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsOwner } from "@/hooks/useAdmin";
import {
  useAddAdmin,
  useAdminTeam,
  useIsOwnerClaimed,
  useRemoveAdmin,
  useSetAdminRole,
} from "@/hooks/useAdminTeam";
import { AdminRole } from "@/types/content";
import type { Admin } from "@/types/content";

/** Turn a backend trap into a short, human message. */
function friendlyError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/owner access required/i.test(raw)) {
    return "Only the owner can manage admins.";
  }
  if (/unauthor|not.?admin|forbidden|access required/i.test(raw)) {
    return "Only the owner can manage admins.";
  }
  if (/not.?ready|backend/i.test(raw)) {
    return "The backend is not ready yet. Try again in a moment.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * Team management: list every admin, add one by principal with a role, change
 * a non-owner's role, and remove admins. All writes are owner-only, enforced
 * server-side and reflected in the UI.
 */
export default function AdminTeam() {
  const [principalInput, setPrincipalInput] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>(AdminRole.editor);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingPrincipal, setRemovingPrincipal] = useState<string | null>(
    null,
  );
  const [changingPrincipal, setChangingPrincipal] = useState<string | null>(
    null,
  );

  const { data: isOwner = false, isLoading: isOwnerLoading } = useIsOwner();
  const { data: isOwnerClaimed } = useIsOwnerClaimed();
  const { data: admins = [], isLoading, isError, refetch } = useAdminTeam();
  const addAdmin = useAddAdmin();
  const setAdminRole = useSetAdminRole();
  const removeAdmin = useRemoveAdmin();

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setActionError(null);

    const trimmed = principalInput.trim();
    if (!trimmed) {
      setFormError("Enter a principal to add.");
      return;
    }

    let principal: Principal;
    try {
      principal = Principal.fromText(trimmed);
    } catch {
      setFormError("That is not a valid principal. Check the value and retry.");
      return;
    }

    setPrincipalInput("");
    addAdmin.mutate(
      { principal, role: newRole },
      {
        onError: (error) => {
          setPrincipalInput((current) => (current === "" ? trimmed : current));
          setFormError(friendlyError(error));
        },
      },
    );
  }

  function handleRoleChange(principal: Admin["principal"], role: AdminRole) {
    setActionError(null);
    setChangingPrincipal(principal.toText());
    setAdminRole.mutate(
      { principal, role },
      {
        onSettled: () => setChangingPrincipal(null),
        onError: (error) => setActionError(friendlyError(error)),
      },
    );
  }

  function handleRemove(principal: Admin["principal"]) {
    setActionError(null);
    setRemovingPrincipal(principal.toText());
    removeAdmin.mutate(principal, {
      onSettled: () => setRemovingPrincipal(null),
      onError: (error) => setActionError(friendlyError(error)),
    });
  }

  return (
    <>
      <PageMeta
        title="Team"
        description="Manage Ovanite administrators and their access."
      />
      <div className="border-b border-border bg-card">
        <Container className="py-10 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Admin · Access</p>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Team
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Admins can review submissions and manage site content. Every
                admin action is authorised on the server.
              </p>
            </div>
            <MicroBadge data-ocid="admin.team.count_badge">
              {admins.length} {admins.length === 1 ? "admin" : "admins"}
            </MicroBadge>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        {isOwnerClaimed === false ? (
          <div
            data-ocid="admin.team.claim_owner_state"
            className="mb-8 flex flex-wrap items-center gap-3 rounded-sm border border-primary/30 bg-primary/5 px-5 py-4"
          >
            <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" />
            <p className="text-sm text-foreground">
              No owner has been claimed yet. The first signed-in visitor with
              the configured owner email can claim ownership from the admin
              gate.
            </p>
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Administrators
            </h2>
            <div className="mt-5">
              <AdminTeamList
                admins={admins}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => void refetch()}
                onRemove={handleRemove}
                onRoleChange={handleRoleChange}
                removingPrincipal={removingPrincipal}
                changingPrincipal={changingPrincipal}
                canManage={isOwner}
              />
            </div>
            {actionError ? (
              <p
                data-ocid="admin.team.error_state"
                role="alert"
                className="mt-4 rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {actionError}
              </p>
            ) : null}
          </div>

          <aside className="min-w-0">
            <div className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Add an admin
              </h2>
              {isOwnerLoading ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                  Checking permissions…
                </p>
              ) : isOwner ? (
                <form className="mt-5" onSubmit={handleAdd}>
                  <Label htmlFor="admin-principal" className="eyebrow">
                    Principal
                  </Label>
                  <Input
                    id="admin-principal"
                    data-ocid="admin.team.principal_input"
                    value={principalInput}
                    onChange={(event) => setPrincipalInput(event.target.value)}
                    placeholder="aaaaa-aa…"
                    autoComplete="off"
                    spellCheck={false}
                    className="mt-2 rounded-sm font-mono text-xs"
                    aria-invalid={formError ? true : undefined}
                    aria-describedby={
                      formError ? "admin-principal-error" : undefined
                    }
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    The new admin signs in with their own Internet Identity.
                  </p>

                  <Label htmlFor="admin-role" className="eyebrow mt-5 block">
                    Role
                  </Label>
                  <Select
                    value={newRole}
                    onValueChange={(value) => setNewRole(value as AdminRole)}
                  >
                    <SelectTrigger
                      id="admin-role"
                      data-ocid="admin.team.role_select"
                      className="mt-2 h-9 w-full rounded-sm font-mono text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AdminRole.editor}>
                        Editor — manage content and submissions
                      </SelectItem>
                      <SelectItem value={AdminRole.viewer}>
                        Viewer — read-only access
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {formError ? (
                    <p
                      id="admin-principal-error"
                      data-ocid="admin.team.form_error"
                      role="alert"
                      className="mt-3 text-sm text-destructive"
                    >
                      {formError}
                    </p>
                  ) : null}
                  <PrimaryButton
                    type="submit"
                    className="mt-5 w-full"
                    data-ocid="admin.team.add_button"
                    disabled={addAdmin.isPending}
                  >
                    {addAdmin.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                    ) : (
                      <UserPlus aria-hidden="true" className="mr-2 h-4 w-4" />
                    )}
                    Add admin
                  </PrimaryButton>
                </form>
              ) : (
                <p
                  data-ocid="admin.team.owner_only_state"
                  className="mt-3 text-sm text-muted-foreground"
                >
                  Only the owner can add, re-role, or remove admins. You can
                  review the roster here.
                </p>
              )}
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
