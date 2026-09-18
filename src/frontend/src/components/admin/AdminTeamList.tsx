import { Loader2, RefreshCw, ShieldCheck, Trash2, Users } from "lucide-react";

import { MicroBadge, SecondaryButton } from "@/components/shared/primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AdminRole } from "@/types/content";
import type { Admin } from "@/types/content";

type AdminTeamListProps = {
  admins: Admin[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onRemove: (principal: Admin["principal"]) => void;
  onRoleChange: (principal: Admin["principal"], role: AdminRole) => void;
  removingPrincipal: string | null;
  changingPrincipal: string | null;
  canManage: boolean;
};

const ROLE_LABELS: Record<AdminRole, string> = {
  [AdminRole.owner]: "Owner",
  [AdminRole.editor]: "Editor",
  [AdminRole.viewer]: "Viewer",
};

/**
 * The team roster: every admin with their principal, role, and added date.
 * Role changes and removal are owner-only; the owner row is protected.
 */
export function AdminTeamList({
  admins,
  isLoading,
  isError,
  onRetry,
  onRemove,
  onRoleChange,
  removingPrincipal,
  changingPrincipal,
  canManage,
}: AdminTeamListProps) {
  if (isLoading) {
    return (
      <div
        data-ocid="admin.team.loading_state"
        className="space-y-2"
        aria-busy="true"
      >
        {Array.from({ length: 3 }, (_, i) => `admin-skeleton-${i}`).map(
          (id) => (
            <div
              key={id}
              className="rounded-sm border border-border bg-card p-5"
            >
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-3 h-3 w-32" />
            </div>
          ),
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="admin.team.error_state"
        className="rounded-sm border border-destructive/30 bg-destructive/5 p-6 text-center"
      >
        <p className="font-display text-base font-semibold">
          Could not load the team
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The admin roster is unavailable right now.
        </p>
        <SecondaryButton
          type="button"
          className="mt-4"
          data-ocid="admin.team.retry_button"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />
          Retry
        </SecondaryButton>
      </div>
    );
  }

  if (admins.length === 0) {
    return (
      <div
        data-ocid="admin.team.empty_state"
        className="rounded-sm border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
      >
        <Users
          aria-hidden="true"
          className="mx-auto h-6 w-6 text-muted-foreground"
        />
        <p className="mt-4 font-display text-base font-semibold">
          No admins yet
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Add an admin by principal to grant access to the dashboard.
        </p>
      </div>
    );
  }

  return (
    <ul data-ocid="admin.team.list" className="space-y-2" aria-label="Admins">
      {admins.map((admin, index) => {
        const principalText = admin.principal.toText();
        const isRemoving = removingPrincipal === principalText;
        const isChanging = changingPrincipal === principalText;
        const role = admin.role;
        return (
          <li
            key={principalText}
            data-ocid={`admin.team.item.${index + 1}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-border bg-card p-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs break-all text-foreground">
                  {principalText}
                </span>
                {admin.isOwner ? (
                  <MicroBadge className="border-primary/40 text-primary">
                    <ShieldCheck aria-hidden="true" className="mr-1 h-3 w-3" />
                    Owner
                  </MicroBadge>
                ) : (
                  <MicroBadge>{ROLE_LABELS[role]}</MicroBadge>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {admin.email ? `${admin.email} · ` : ""}
                {admin.addedAt > 0n
                  ? `Added ${formatDate(admin.addedAt)}`
                  : "Founding admin"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManage && !admin.isOwner ? (
                <>
                  <Select
                    value={role}
                    onValueChange={(value) =>
                      onRoleChange(admin.principal, value as AdminRole)
                    }
                    disabled={isChanging || isRemoving}
                  >
                    <SelectTrigger
                      data-ocid={`admin.team.role_select.${index + 1}`}
                      aria-label={`Role for ${principalText}`}
                      className="h-9 w-[8.5rem] rounded-sm font-mono text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AdminRole.editor}>
                        {ROLE_LABELS[AdminRole.editor]}
                      </SelectItem>
                      <SelectItem value={AdminRole.viewer}>
                        {ROLE_LABELS[AdminRole.viewer]}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <SecondaryButton
                    type="button"
                    className={cn(
                      "border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive",
                    )}
                    data-ocid={`admin.team.remove_button.${index + 1}`}
                    onClick={() => onRemove(admin.principal)}
                    disabled={isRemoving || isChanging}
                  >
                    {isRemoving ? (
                      <Loader2
                        aria-hidden="true"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                    ) : (
                      <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
                    )}
                    Remove
                  </SecondaryButton>
                </>
              ) : (
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
                  {admin.isOwner ? "Protected" : "Owner only"}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export { ROLE_LABELS };
