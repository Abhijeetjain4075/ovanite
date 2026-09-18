import { Check, Inbox, Loader2, Mail, Trash2 } from "lucide-react";

import { SubmissionStatus as Status } from "@/backend";
import {
  MicroBadge,
  PrimaryButton,
  SecondaryButton,
  StatusDot,
} from "@/components/shared/primitives";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Submission, SubmissionStatus } from "@/types/content";

type SubmissionDetailProps = {
  submission: Submission | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onMarkRead: () => void;
  onMarkHandled: () => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
  actionError: string | null;
};

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  [Status.new_]: "New",
  [Status.read]: "Read",
  [Status.handled]: "Handled",
};

function kindLabel(kind: Submission["kind"]): string {
  return kind === "waitlist" ? "Waitlist" : "Contact";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border py-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

/**
 * The detail pane: full submitted fields, timestamps, and the status actions.
 * Renders an empty prompt when nothing is selected.
 */
export function SubmissionDetail({
  submission,
  isLoading,
  isError,
  onRetry,
  onMarkRead,
  onMarkHandled,
  onDelete,
  isUpdating,
  isDeleting,
  actionError,
}: SubmissionDetailProps) {
  if (isLoading) {
    return (
      <div
        data-ocid="admin.submission_detail.loading_state"
        className="flex h-full min-h-[320px] items-center justify-center gap-3 rounded-sm border border-border bg-card text-muted-foreground"
      >
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading submission…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="admin.submission_detail.error_state"
        className="rounded-sm border border-destructive/30 bg-destructive/5 p-8 text-center"
      >
        <p className="font-display text-base font-semibold">
          Could not load this submission
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been removed, or the connection dropped.
        </p>
        <SecondaryButton
          type="button"
          className="mt-4"
          data-ocid="admin.submission_detail.retry_button"
          onClick={onRetry}
        >
          Retry
        </SecondaryButton>
      </div>
    );
  }

  if (!submission) {
    return (
      <div
        data-ocid="admin.submission_detail.empty_state"
        className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/30 px-6 text-center"
      >
        <Inbox aria-hidden="true" className="h-6 w-6 text-muted-foreground" />
        <p className="mt-4 font-display text-base font-semibold">
          Select a submission
        </p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Choose an entry from the inbox to read the full message and update its
          status.
        </p>
      </div>
    );
  }

  const isUnread = submission.status === Status.new_;
  const isHandled = submission.status === Status.handled;

  return (
    <article
      data-ocid="admin.submission_detail.panel"
      className="rounded-sm border border-border bg-card"
    >
      <header className="border-b border-border p-6">
        <div className="flex flex-wrap items-center gap-2">
          <MicroBadge>{kindLabel(submission.kind)}</MicroBadge>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em]",
              isUnread
                ? "border-primary/40 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {isUnread ? <StatusDot /> : null}
            {STATUS_LABEL[submission.status]}
          </span>
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
          {submission.name}
        </h2>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
          <a
            href={`mailto:${submission.email}`}
            className="break-all underline-offset-4 hover:text-foreground hover:underline"
          >
            {submission.email}
          </a>
        </p>
      </header>

      <div className="p-6">
        <dl>
          <Field label="Message" value={submission.message ?? "—"} />
          <Field
            label="Received"
            value={formatDateTime(submission.createdAt)}
          />
          <Field
            label="Last updated"
            value={formatDateTime(submission.updatedAt)}
          />
          <Field label="Reference" value={`#${submission.id.toString()}`} />
        </dl>

        {actionError ? (
          <p
            data-ocid="admin.submission_detail.error_state"
            role="alert"
            className="mt-4 rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {actionError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <PrimaryButton
            type="button"
            data-ocid="admin.submission_detail.mark_read_button"
            onClick={onMarkRead}
            disabled={isUpdating || !isUnread}
          >
            {isUpdating ? (
              <Loader2
                aria-hidden="true"
                className="mr-2 h-4 w-4 animate-spin"
              />
            ) : (
              <Check aria-hidden="true" className="mr-2 h-4 w-4" />
            )}
            Mark as read
          </PrimaryButton>
          <SecondaryButton
            type="button"
            data-ocid="admin.submission_detail.mark_handled_button"
            onClick={onMarkHandled}
            disabled={isUpdating || isHandled}
          >
            <Check aria-hidden="true" className="mr-2 h-4 w-4" />
            Mark as handled
          </SecondaryButton>
          <SecondaryButton
            type="button"
            className="ml-auto border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
            data-ocid="admin.submission_detail.delete_button"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2
                aria-hidden="true"
                className="mr-2 h-4 w-4 animate-spin"
              />
            ) : (
              <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
            )}
            Delete
          </SecondaryButton>
        </div>
      </div>
    </article>
  );
}
