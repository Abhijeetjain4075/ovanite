import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PublishState } from "@/backend";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageMeta } from "@/components/layout/PageMeta";
import {
  MicroBadge,
  PrimaryButton,
  SecondaryButton,
  StatusDot,
} from "@/components/shared/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminProducts,
  useCreateProduct,
  useDeleteProduct,
  useSetProductState,
  useUpdateProduct,
} from "@/hooks/useAdminProducts";
import { formatDate, hasProductImage } from "@/lib/format";
import type { Product, ProductInput } from "@/types/content";

const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `admin-products-skeleton-${i}`,
);

function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Unauthorized")) {
    return "You do not have permission to perform this action.";
  }
  return "Something went wrong. Please try again.";
}

export default function AdminProducts() {
  const { data, isLoading, isError, refetch } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const setProductState = useSetProductState();
  const deleteProduct = useDeleteProduct();

  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<bigint | null>(null);
  const [stateErrorId, setStateErrorId] = useState<bigint | null>(null);
  const [deleteErrorId, setDeleteErrorId] = useState<bigint | null>(null);

  const products = data ?? [];
  const sorted = [...products].sort((a, b) => {
    if (a.sortOrder === b.sortOrder) return Number(a.id - b.id);
    return a.sortOrder < b.sortOrder ? -1 : 1;
  });

  const formOpen = creating || editing !== null;
  const activeMutation = editing ? updateProduct : createProduct;

  function closeForm() {
    setCreating(false);
    setEditing(null);
    createProduct.reset();
    updateProduct.reset();
  }

  function handleSubmit(input: ProductInput) {
    if (editing) {
      updateProduct.mutate(
        { id: editing.id, patch: input },
        { onSuccess: () => closeForm() },
      );
      return;
    }
    createProduct.mutate(input, { onSuccess: () => closeForm() });
  }

  return (
    <>
      <PageMeta
        title="Products"
        description="Create, edit, order, and publish the products shown on the Ovanite site."
      />
      <AdminLayout
        title="Products"
        description="Create, edit, order, and publish the products shown on the public site."
        action={
          <PrimaryButton
            type="button"
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            data-ocid="admin.products.create_button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New product
          </PrimaryButton>
        }
      >
        {formOpen ? (
          <div className="mb-8">
            <h2 className="mb-4 font-display text-lg font-bold tracking-tight">
              {editing ? `Edit “${editing.name}”` : "New product"}
            </h2>
            <ProductForm
              key={editing ? String(editing.id) : "new"}
              product={editing ?? undefined}
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
          <div data-ocid="admin.products.loading_state" className="space-y-3">
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-24 rounded-sm" />
            ))}
          </div>
        ) : isError ? (
          <div
            data-ocid="admin.products.error_state"
            className="border border-border bg-card p-8"
          >
            <p className="text-sm text-muted-foreground">
              We couldn&rsquo;t load the products.
            </p>
            <SecondaryButton
              type="button"
              className="mt-4"
              onClick={() => void refetch()}
              data-ocid="admin.products.retry_button"
            >
              Try again
            </SecondaryButton>
          </div>
        ) : sorted.length === 0 ? (
          <div
            data-ocid="admin.products.empty_state"
            className="border border-border bg-card p-10 text-center"
          >
            <p className="eyebrow">No products</p>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
              Add your first product
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Products you create here appear on the public products page once
              published.
            </p>
            <PrimaryButton
              type="button"
              className="mt-6"
              onClick={() => setCreating(true)}
              data-ocid="admin.products.empty_create_button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              New product
            </PrimaryButton>
          </div>
        ) : (
          <ul data-ocid="admin.products.list" className="space-y-3">
            {sorted.map((product, i) => {
              const isPublished = product.state === "published";
              return (
                <li
                  key={String(product.id)}
                  data-ocid={`admin.products.item.${i + 1}`}
                  className="border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      {hasProductImage(product.imageKey) && product.imageKey ? (
                        <img
                          src={product.imageKey.getDirectURL()}
                          alt={`${product.name} logo`}
                          className="h-12 w-12 shrink-0 rounded-sm border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-dashed border-border font-mono text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-display text-lg font-bold tracking-tight">
                            {product.name}
                          </h3>
                          <MicroBadge>
                            {isPublished ? "Published" : "Draft"}
                          </MicroBadge>
                        </div>
                        <p className="mt-1 line-clamp-2 max-w-xl text-sm text-muted-foreground">
                          {product.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                          <span>Order {String(product.sortOrder)}</span>
                          <span>Updated {formatDate(product.updatedAt)}</span>
                          {product.link ? (
                            <a
                              href={product.link}
                              target="_blank"
                              rel="noreferrer"
                              data-ocid={`admin.products.link.${i + 1}`}
                              className="inline-flex items-center gap-1 rounded-sm text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              Visit
                              <ExternalLink
                                aria-hidden="true"
                                className="h-3 w-3"
                              />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <SecondaryButton
                        type="button"
                        onClick={() => {
                          setStateErrorId(null);
                          setProductState.mutate(
                            {
                              id: product.id,
                              state: isPublished
                                ? PublishState.draft
                                : PublishState.published,
                            },
                            {
                              onError: () => setStateErrorId(product.id),
                            },
                          );
                        }}
                        disabled={setProductState.isPending}
                        data-ocid={`admin.products.publish_toggle.${i + 1}`}
                      >
                        {isPublished ? "Unpublish" : "Publish"}
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        onClick={() => {
                          setCreating(false);
                          setEditing(product);
                        }}
                        data-ocid={`admin.products.edit_button.${i + 1}`}
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                        Edit
                      </SecondaryButton>
                      {confirmingId === product.id ? (
                        <>
                          <SecondaryButton
                            type="button"
                            onClick={() => {
                              setDeleteErrorId(null);
                              deleteProduct.mutate(product.id, {
                                onError: () => setDeleteErrorId(product.id),
                              });
                              setConfirmingId(null);
                            }}
                            disabled={deleteProduct.isPending}
                            data-ocid={`admin.products.confirm_delete_button.${i + 1}`}
                            className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          >
                            Confirm delete
                          </SecondaryButton>
                          <SecondaryButton
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            data-ocid={`admin.products.cancel_delete_button.${i + 1}`}
                          >
                            Cancel
                          </SecondaryButton>
                        </>
                      ) : (
                        <SecondaryButton
                          type="button"
                          onClick={() => setConfirmingId(product.id)}
                          data-ocid={`admin.products.delete_button.${i + 1}`}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                          Delete
                        </SecondaryButton>
                      )}
                    </div>
                  </div>

                  {setProductState.isError && stateErrorId === product.id ? (
                    <p
                      role="alert"
                      data-ocid={`admin.products.state_error.${i + 1}`}
                      className="mt-3 text-sm text-destructive"
                    >
                      {errorText(setProductState.error)}
                    </p>
                  ) : null}
                  {deleteProduct.isError && deleteErrorId === product.id ? (
                    <p
                      role="alert"
                      data-ocid={`admin.products.delete_error.${i + 1}`}
                      className="mt-3 text-sm text-destructive"
                    >
                      {errorText(deleteProduct.error)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {!isLoading && !isError && sorted.length > 0 ? (
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <StatusDot />
            Draft products are hidden from the public site until published.
          </p>
        ) : null}
      </AdminLayout>
    </>
  );
}
