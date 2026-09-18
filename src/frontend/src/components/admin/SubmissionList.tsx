import { Inbox, Loader2, Mail, RefreshCw } from "lucide-react";

import { SubmissionStatus as Status } from "@/backend";
import {
  MicroBadge,
  SecondaryButton,
  StatusDot,
} from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Submission, SubmissionStatus } from "@/types/content";

type SubmissionListProps = {
  submissions: Submission[];
  selectedId: bigint | null;
  onSelect: (id: bigint) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  [Status.new_]: "New",
  [Status.read]: "Read",
  [Status.handled]: "Handled",
};

function statusTone(status: SubmissionStatus): string {
  if (status === Status.new_) return "border-primary/40 text-primary";
  if (status === Status.handled) return "border-border text-muted-foreground";
  return "border-border text-foreground";
}

function kindLabel(kind: Submission["kind"]): string {
  return kind === "waitlist" ? "Waitlist" : "Contact";
}

/**
 * The inbox column: a chronological (newest-first) list of submissions with
 * kind, status, sender, and received time. Selection is controlled by the page.
 */
export function SubmissionList({
  submissions,
  selectedId,
  onSelect,
  isLoading,
  isError,
  onRetry,
}: SubmissionListProps) {
  if (isLoading) {
    return (
      <div
        data-ocid="admin.submissions.loading_state"
        className="space-y-2"
        aria-busy="true"
      >
        {Array.from({ length: 5 }, (_, i) => `submission-skeleton-${i}`).map(
          (id) => (
            <div
              key={id}
              className="rounded-sm border border-border bg-card p-4"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ),
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="admin.submissions.error_state"
        className="rounded-sm border border-destructive/30 bg-destructive/5 p-6 text-center"
      >
        <p className="font-display text-base font-semibold">
          Could not load submissions
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The inbox is unavailable right now. Check your connection and try
          again.
        </p>
        <SecondaryButton
          type="button"
          className="mt-4"
          data-ocid="admin.submissions.retry_button"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />
          Retry
        </SecondaryButton>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div
        data-ocid="admin.submissions.empty_state"
        className="rounded-sm border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
      >
        <Inbox
          aria-hidden="true"
          className="mx-auto h-6 w-6 text-muted-foreground"
        />
        <p className="mt-4 font-display text-base font-semibold">
          No submissions here
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Nothing matches the current filter. Try a different kind or status.
        </p>
      </div>
    );
  }

  return (
    <ul
      data-ocid="admin.submissions.list"
      className="space-y-2"
      aria-label="Submissions"
    >
      {submissions.map((submission, index) => {
        const isSelected = selectedId === submission.id;
        const isUnread = submission.status === Status.new_;
        return (
          <li key={submission.id.toString()}>
            <button
              type="button"
              data-ocid={`admin.submissions.item.${index + 1}`}
              aria-current={isSelected ? "true" : undefined}
              onClick={() => onSelect(submission.id)}
              className={cn(
                "w-full rounded-sm border bg-card p-4 text-left transition-smooth",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected
                  ? "border-primary/50 shadow-subtle"
                  : "border-border hover:border-primary/30 hover:shadow-subtle",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  {isUnread ? <StatusDot /> : null}
                  <MicroBadge>{kindLabel(submission.kind)}</MicroBadge>
                </span>
                <span
                  className={cn(
                    "rounded-sm border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em]",
                    statusTone(submission.status),
                  )}
                >
                  {STATUS_LABEL[submission.status]}
                </span>
              </div>
              <p
                className={cn(
                  "mt-3 truncate font-display text-sm",
                  isUnread ? "font-semibold" : "font-medium",
                )}
              >
                {submission.name}
              </p>
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Mail aria-hidden="true" className="h-3 w-3 shrink-0" />
                <span className="truncate">{submission.email}</span>
              </p>
              <p className="mt-2 font-mono text-[0.6875rem] text-muted-foreground">
                {formatDateTime(submission.createdAt)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Small helper so the page can render a consistent "load more" affordance. */
export function SubmissionListFooter({
  count,
  onRefresh,
  isRefreshing,
}: {
  count: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
        {count} {count === 1 ? "entry" : "entries"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-sm"
        data-ocid="admin.submissions.refresh_button"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <Loader2
            aria-hidden="true"
            className="mr-2 h-3.5 w-3.5 animate-spin"
          />
        ) : (
          <RefreshCw aria-hidden="true" className="mr-2 h-3.5 w-3.5" />
        )}
        Refresh
      </Button>
    </div>
  );
}
