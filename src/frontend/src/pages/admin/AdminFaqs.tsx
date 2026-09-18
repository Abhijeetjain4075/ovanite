import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PublishState } from "@/backend";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { FaqForm } from "@/components/admin/FaqForm";
import { PageMeta } from "@/components/layout/PageMeta";
import {
  MicroBadge,
  PrimaryButton,
  SecondaryButton,
} from "@/components/shared/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminFaqs,
  useCreateFaq,
  useDeleteFaq,
  useSetFaqState,
  useUpdateFaq,
} from "@/hooks/useAdminFaqs";
import { formatDate } from "@/lib/format";
import type { Faq, FaqInput } from "@/types/content";

const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `admin-faqs-skeleton-${i}`,
);

function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Unauthorized")) {
    return "You do not have permission to perform this action.";
  }
  return "Something went wrong. Please try again.";
}

export default function AdminFaqs() {
  const { data, isLoading, isError, refetch } = useAdminFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const setFaqState = useSetFaqState();
  const deleteFaq = useDeleteFaq();

  const [editing, setEditing] = useState<Faq | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<bigint | null>(null);

  const faqs = data ?? [];
  const sorted = [...faqs].sort((a, b) => {
    if (a.sortOrder === b.sortOrder) return Number(a.id - b.id);
    return a.sortOrder < b.sortOrder ? -1 : 1;
  });

  const formOpen = creating || editing !== null;
  const activeMutation = editing ? updateFaq : createFaq;

  function closeForm() {
    setCreating(false);
    setEditing(null);
    createFaq.reset();
    updateFaq.reset();
  }

  function handleSubmit(input: FaqInput) {
    if (editing) {
      updateFaq.mutate(
        { id: editing.id, patch: input },
        { onSuccess: () => closeForm() },
      );
      return;
    }
    createFaq.mutate(input, { onSuccess: () => closeForm() });
  }

  return (
    <>
      <PageMeta
        title="FAQs"
        description="Create, edit, order, and publish the frequently asked questions shown on the Ovanite site."
      />
      <AdminLayout
        title="FAQs"
        description="Create, edit, order, and publish the questions shown on the public site."
        action={
          <PrimaryButton
            type="button"
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            data-ocid="admin.faqs.create_button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New FAQ
          </PrimaryButton>
        }
      >
        {formOpen ? (
          <div className="mb-8">
            <h2 className="mb-4 font-display text-lg font-bold tracking-tight">
              {editing ? "Edit FAQ" : "New FAQ"}
            </h2>
            <FaqForm
              key={editing ? String(editing.id) : "new"}
              faq={editing ?? undefined}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              isPending={activeMutation.isPending}
              errorMessage={
                activeMutation.isError
                  ? errorText(activeMutation.error)
                  : undefined
              }
            />
          </div>
        ) : null}

        {isLoading ? (
          <div data-ocid="admin.faqs.loading_state" className="space-y-3">
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-24 rounded-sm" />
            ))}
          </div>
        ) : isError ? (
          <div
            data-ocid="admin.faqs.error_state"
            className="border border-border bg-card p-8"
          >
            <p className="text-sm text-muted-foreground">
              We couldn&rsquo;t load the FAQs.
            </p>
            <SecondaryButton
              type="button"
              className="mt-4"
              onClick={() => void refetch()}
              data-ocid="admin.faqs.retry_button"
            >
              Try again
            </SecondaryButton>
          </div>
        ) : sorted.length === 0 ? (
          <div
            data-ocid="admin.faqs.empty_state"
            className="border border-border bg-card p-10 text-center"
          >
            <p className="eyebrow">No FAQs</p>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
              Add your first FAQ
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Published FAQs appear in the questions section of the public site.
            </p>
            <PrimaryButton
              type="button"
              className="mt-6"
              onClick={() => setCreating(true)}
              data-ocid="admin.faqs.empty_create_button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              New FAQ
            </PrimaryButton>
          </div>
        ) : (
          <ul data-ocid="admin.faqs.list" className="space-y-3">
            {sorted.map((faq, i) => {
              const isPublished = faq.state === "published";
              return (
                <li
                  key={String(faq.id)}
                  data-ocid={`admin.faqs.item.${i + 1}`}
                  className="border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold tracking-tight">
                          {faq.question}
                        </h3>
                        <MicroBadge>
                          {isPublished ? "Published" : "Draft"}
                        </MicroBadge>
                      </div>
                      <p className="mt-2 line-clamp-3 max-w-2xl text-sm text-muted-foreground">
                        {faq.answer}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                        <span>Order {String(faq.sortOrder)}</span>
                        <span>Updated {formatDate(faq.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <SecondaryButton
                        type="button"
                        onClick={() =>
                          setFaqState.mutate({
                            id: faq.id,
                            state: isPublished
                              ? PublishState.draft
                              : PublishState.published,
                          })
                        }
                        disabled={setFaqState.isPending}
                        data-ocid={`admin.faqs.publish_toggle.${i + 1}`}
                      >
                        {isPublished ? "Unpublish" : "Publish"}
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        onClick={() => {
                          setCreating(false);
                          setEditing(faq);
                        }}
                        data-ocid={`admin.faqs.edit_button.${i + 1}`}
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                        Edit
                      </SecondaryButton>
                      {confirmingId === faq.id ? (
                        <>
                          <SecondaryButton
                            type="button"
                            onClick={() => {
                              deleteFaq.mutate(faq.id);
                              setConfirmingId(null);
                            }}
                            disabled={deleteFaq.isPending}
                            data-ocid={`admin.faqs.confirm_delete_button.${i + 1}`}
                            className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          >
                            Confirm delete
                          </SecondaryButton>
                          <SecondaryButton
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            data-ocid={`admin.faqs.cancel_delete_button.${i + 1}`}
                          >
                            Cancel
                          </SecondaryButton>
                        </>
                      ) : (
                        <SecondaryButton
                          type="button"
                          onClick={() => setConfirmingId(faq.id)}
                          data-ocid={`admin.faqs.delete_button.${i + 1}`}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                          Delete
                        </SecondaryButton>
                      )}
                    </div>
                  </div>

                  {setFaqState.isError ? (
                    <p
                      role="alert"
                      data-ocid={`admin.faqs.state_error.${i + 1}`}
                      className="mt-3 text-sm text-destructive"
                    >
                      {errorText(setFaqState.error)}
                    </p>
                  ) : null}
                  {deleteFaq.isError ? (
                    <p
                      role="alert"
                      data-ocid={`admin.faqs.delete_error.${i + 1}`}
                      className="mt-3 text-sm text-destructive"
                    >
                      {errorText(deleteFaq.error)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </AdminLayout>
    </>
  );
}
