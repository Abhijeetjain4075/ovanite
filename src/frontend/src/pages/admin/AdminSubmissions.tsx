import { useMemo, useState } from "react";

import { SubmissionKind as Kind, SubmissionStatus as Status } from "@/backend";
import { SubmissionDetail } from "@/components/admin/SubmissionDetail";
import {
  SubmissionList,
  SubmissionListFooter,
} from "@/components/admin/SubmissionList";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { MicroBadge } from "@/components/shared/primitives";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminSubmissions,
  useDeleteSubmission,
  useSetSubmissionStatus,
} from "@/hooks/useAdminSubmissions";
import { cn } from "@/lib/utils";
import type {
  SubmissionFilter,
  SubmissionKind,
  SubmissionStatus,
} from "@/types/content";

type KindFilter = "all" | SubmissionKind;
type StatusFilter = "all" | SubmissionStatus;

const KIND_TABS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: Kind.contact, label: "Contact" },
  { value: Kind.waitlist, label: "Waitlist" },
];

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: Status.new_, label: "Unread" },
  { value: Status.read, label: "Read" },
  { value: Status.handled, label: "Handled" },
];

/** Turn a backend trap into a short, human message. */
function friendlyError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/unauthor|not.?admin|forbidden|access required/i.test(raw)) {
    return "You do not have permission to perform this action.";
  }
  if (/not.?ready|backend/i.test(raw)) {
    return "The backend is not ready yet. Try again in a moment.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * The submissions inbox: kind and status filtering, newest-first ordering, and
 * a detail pane with mark-as-read / mark-as-handled / delete actions.
 */
export default function AdminSubmissions() {
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filter = useMemo<SubmissionFilter>(
    () => ({
      kind: kind === "all" ? undefined : kind,
      status: status === "all" ? undefined : status,
    }),
    [kind, status],
  );

  const {
    data: submissions = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAdminSubmissions(filter);

  // The unread badge reflects the whole inbox, not the active filter.
  const { data: allSubmissions = [] } = useAdminSubmissions({});

  const setStatusMutation = useSetSubmissionStatus();
  const deleteMutation = useDeleteSubmission();

  const selected = useMemo(
    () => submissions.find((item) => item.id === selectedId) ?? null,
    [submissions, selectedId],
  );

  const unreadCount = useMemo(
    () => allSubmissions.filter((item) => item.status === Status.new_).length,
    [allSubmissions],
  );

  function handleSelect(id: bigint) {
    setActionError(null);
    setSelectedId(id);
  }

  function handleMarkRead() {
    if (!selected) return;
    setActionError(null);
    setStatusMutation.mutate(
      { id: selected.id, status: Status.read },
      { onError: (error) => setActionError(friendlyError(error)) },
    );
  }

  function handleMarkHandled() {
    if (!selected) return;
    setActionError(null);
    setStatusMutation.mutate(
      { id: selected.id, status: Status.handled },
      { onError: (error) => setActionError(friendlyError(error)) },
    );
  }

  function handleDelete() {
    if (!selected) return;
    setActionError(null);
    deleteMutation.mutate(selected.id, {
      onSuccess: () => setSelectedId(null),
      onError: (error) => setActionError(friendlyError(error)),
    });
  }

  return (
    <>
      <PageMeta
        title="Submissions"
        description="Review contact and waitlist submissions for Ovanite."
      />
      <div className="border-b border-border bg-card">
        <Container className="py-10 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Admin · Inbox</p>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Submissions
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Contact and waitlist entries, newest first. No emails are sent —
                every submission is retained here for review.
              </p>
            </div>
            <MicroBadge data-ocid="admin.submissions.unread_badge">
              {unreadCount} unread
            </MicroBadge>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="eyebrow mb-2">Kind</p>
            <Tabs
              value={kind}
              onValueChange={(value) => setKind(value as KindFilter)}
            >
              <TabsList
                data-ocid="admin.submissions.kind.tab"
                className="rounded-sm"
              >
                {KIND_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    data-ocid={`admin.submissions.kind.${tab.value}`}
                    className="rounded-sm"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div>
            <p className="eyebrow mb-2">Status</p>
            <Tabs
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
            >
              <TabsList
                data-ocid="admin.submissions.status.tab"
                className="rounded-sm"
              >
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    data-ocid={`admin.submissions.status.${tab.value}`}
                    className="rounded-sm"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className={cn("min-w-0")}>
            <SubmissionList
              submissions={submissions}
              selectedId={selectedId}
              onSelect={handleSelect}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => void refetch()}
            />
            {!isLoading && !isError && submissions.length > 0 ? (
              <SubmissionListFooter
                count={submissions.length}
                onRefresh={() => void refetch()}
                isRefreshing={isFetching}
              />
            ) : null}
          </div>

          <div className="min-w-0">
            <SubmissionDetail
              submission={selected}
              isLoading={isLoading && selectedId !== null}
              isError={isError && selectedId !== null}
              onRetry={() => void refetch()}
              onMarkRead={handleMarkRead}
              onMarkHandled={handleMarkHandled}
              onDelete={handleDelete}
              isUpdating={setStatusMutation.isPending}
              isDeleting={deleteMutation.isPending}
              actionError={actionError}
            />
          </div>
        </div>
      </Container>
    </>
  );
}
