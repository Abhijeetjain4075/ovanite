import { createActor } from "@/backend";
import type { SiteContentPatch } from "@/backend";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SiteCopyForm } from "@/components/admin/SiteCopyForm";
import { PageMeta } from "@/components/layout/PageMeta";
import { SecondaryButton } from "@/components/shared/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { siteContentQueryKey, useSiteContent } from "@/hooks/useSiteContent";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Unauthorized")) {
    return "You do not have permission to edit site copy.";
  }
  return "Something went wrong saving the site copy. Please try again.";
}

export default function AdminSiteCopy() {
  const { data, isLoading, isError, refetch } = useSiteContent();
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (patch: SiteContentPatch) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateSiteContent(patch);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteContentQueryKey });
    },
  });

  return (
    <>
      <PageMeta
        title="Site Copy"
        description="Edit the headlines, descriptions, and body copy shown across the Ovanite site."
      />
      <AdminLayout
        title="Site Copy"
        description="Edit the headlines, descriptions, and body copy shown across the public site. Clearing a field resets it to the site default."
      >
        {isLoading ? (
          <div data-ocid="admin.site_copy.loading_state" className="space-y-4">
            <Skeleton className="h-64 rounded-sm" />
            <Skeleton className="h-64 rounded-sm" />
          </div>
        ) : isError || !data ? (
          <div
            data-ocid="admin.site_copy.error_state"
            className="border border-border bg-card p-8"
          >
            <p className="text-sm text-muted-foreground">
              We couldn&rsquo;t load the site copy.
            </p>
            <SecondaryButton
              type="button"
              className="mt-4"
              onClick={() => void refetch()}
              data-ocid="admin.site_copy.retry_button"
            >
              Try again
            </SecondaryButton>
          </div>
        ) : (
          <SiteCopyForm
            content={data}
            onSubmit={(patch) => mutation.mutate(patch)}
            isPending={mutation.isPending}
            errorMessage={
              mutation.isError ? errorText(mutation.error) : undefined
            }
          />
        )}
      </AdminLayout>
    </>
  );
}
