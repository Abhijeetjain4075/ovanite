import { f as createLucideIcon, r as reactExports, j as jsxRuntimeExports, l as Label, I as Input, S as SecondaryButton, s as LoaderCircle, X, P as PrimaryButton, E as ExternalBlob, M as MicroBadge, p as PublishState, g as StatusDot } from "./index-nAhl1N96.js";
import { A as AdminLayout } from "./AdminLayout-CNQakB_G.js";
import { T as Textarea } from "./textarea-TnSsLILx.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { S as Skeleton } from "./skeleton-BTXYXnLQ.js";
import { u as useAdminProducts, a as useCreateProduct, b as useUpdateProduct, c as useSetProductState, d as useDeleteProduct } from "./useAdminProducts-DMOkphpd.js";
import { h as hasProductImage, a as formatDate } from "./format-CdAHKqJe.js";
import { P as Plus, a as Pencil } from "./plus-BPvc-N_4.js";
import { T as Trash2 } from "./trash-2-7l5MbcQX.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "M10 14 21 3", key: "gplh6r" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
];
const ExternalLink = createLucideIcon("external-link", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M16 5h6", key: "1vod17" }],
  ["path", { d: "M19 2v6", key: "4bpg5p" }],
  ["path", { d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5", key: "1ue2ih" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }]
];
const ImagePlus = createLucideIcon("image-plus", __iconNode);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
function emptyBlob() {
  return ExternalBlob.fromBytes(new Uint8Array(0), "application/octet-stream");
}
function parseSortOrder(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0n;
  return BigInt(parsed);
}
function ProductForm({
  product,
  onSubmit,
  onCancel,
  isPending,
  errorMessage
}) {
  const fileInputRef = reactExports.useRef(null);
  const [name, setName] = reactExports.useState((product == null ? void 0 : product.name) ?? "");
  const [description, setDescription] = reactExports.useState((product == null ? void 0 : product.description) ?? "");
  const [link, setLink] = reactExports.useState((product == null ? void 0 : product.link) ?? "");
  const [sortOrder, setSortOrder] = reactExports.useState(
    product ? String(product.sortOrder) : "0"
  );
  const [image, setImage] = reactExports.useState(
    (product == null ? void 0 : product.imageKey) ?? null
  );
  const [uploading, setUploading] = reactExports.useState(false);
  const [uploadError, setUploadError] = reactExports.useState(null);
  const nameError = name.trim() === "" ? "A product name is required." : null;
  const descriptionError = description.trim() === "" ? "A description is required." : null;
  const previewUrl = image ? image.getDirectURL() : null;
  async function handleFileChange(event) {
    var _a;
    const file = (_a = event.target.files) == null ? void 0 : _a[0];
    event.target.value = "";
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Choose an image file (PNG, JPG, SVG, or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Images must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setImage(ExternalBlob.fromBytes(bytes, file.type, file.name));
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }
  function handleSubmit(event) {
    event.preventDefault();
    if (nameError || descriptionError || uploading) return;
    const imageKey = image ?? ((product == null ? void 0 : product.imageKey) ? emptyBlob() : void 0);
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      link: link.trim(),
      imageKey,
      sortOrder: parseSortOrder(sortOrder)
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      noValidate: true,
      onSubmit: handleSubmit,
      "data-ocid": "admin.product_form",
      className: "space-y-6 border border-border bg-card p-6 md:p-8",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "product-name", className: "mb-2", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "product-name",
              value: name,
              onChange: (event) => setName(event.target.value),
              "aria-invalid": nameError ? true : void 0,
              "aria-describedby": nameError ? "product-name-error" : void 0,
              "data-ocid": "admin.product.name_input",
              className: "h-11 rounded-sm"
            }
          ),
          nameError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: "product-name-error",
              role: "alert",
              "data-ocid": "admin.product.name_error",
              className: "mt-2 text-sm text-destructive",
              children: nameError
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "product-description", className: "mb-2", children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "product-description",
              rows: 4,
              value: description,
              onChange: (event) => setDescription(event.target.value),
              "aria-invalid": descriptionError ? true : void 0,
              "aria-describedby": descriptionError ? "product-description-error" : void 0,
              "data-ocid": "admin.product.description_textarea",
              className: "min-h-28 rounded-sm"
            }
          ),
          descriptionError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: "product-description-error",
              role: "alert",
              "data-ocid": "admin.product.description_error",
              className: "mt-2 text-sm text-destructive",
              children: descriptionError
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "product-link", className: "mb-2", children: [
              "Link ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "(optional)" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "product-link",
                type: "url",
                inputMode: "url",
                placeholder: "https://",
                value: link,
                onChange: (event) => setLink(event.target.value),
                "data-ocid": "admin.product.link_input",
                className: "h-11 rounded-sm"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "product-sort-order", className: "mb-2", children: "Order" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "product-sort-order",
                type: "number",
                min: 0,
                inputMode: "numeric",
                value: sortOrder,
                onChange: (event) => setSortOrder(event.target.value),
                "data-ocid": "admin.product.sort_order_input",
                className: "h-11 rounded-sm"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Lower numbers appear first." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "product-image", className: "mb-2", children: [
            "Image / logo ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "(optional)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
            previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: previewUrl,
                alt: "Product preview",
                className: "h-16 w-16 rounded-sm border border-border object-cover"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-sm border border-dashed border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { "aria-hidden": "true", className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: fileInputRef,
                id: "product-image",
                type: "file",
                accept: "image/*",
                className: "sr-only",
                onChange: handleFileChange,
                "data-ocid": "admin.product.image_input"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SecondaryButton,
              {
                type: "button",
                onClick: () => {
                  var _a;
                  return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                },
                disabled: uploading,
                "data-ocid": "admin.product.upload_button",
                children: uploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { "aria-hidden": "true", className: "h-4 w-4 animate-spin" }),
                  "Uploading…"
                ] }) : "Upload image"
              }
            ),
            previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              SecondaryButton,
              {
                type: "button",
                onClick: () => setImage(null),
                "data-ocid": "admin.product.remove_image_button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(X, { "aria-hidden": "true", className: "h-4 w-4" }),
                  "Remove"
                ]
              }
            ) : null
          ] }),
          uploadError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              role: "alert",
              "data-ocid": "admin.product.upload_error",
              className: "mt-2 text-sm text-destructive",
              children: uploadError
            }
          ) : null
        ] }),
        errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            role: "alert",
            "data-ocid": "admin.product.form_error",
            className: "border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive",
            children: errorMessage
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 border-t border-border pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PrimaryButton,
            {
              type: "submit",
              disabled: isPending || uploading,
              "data-ocid": "admin.product.submit_button",
              children: isPending ? "Saving…" : product ? "Save changes" : "Create product"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SecondaryButton,
            {
              type: "button",
              onClick: onCancel,
              disabled: isPending,
              "data-ocid": "admin.product.cancel_button",
              children: "Cancel"
            }
          )
        ] })
      ]
    }
  );
}
const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `admin-products-skeleton-${i}`
);
function errorText(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Unauthorized")) {
    return "You do not have permission to perform this action.";
  }
  return "Something went wrong. Please try again.";
}
function AdminProducts() {
  const { data, isLoading, isError, refetch } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const setProductState = useSetProductState();
  const deleteProduct = useDeleteProduct();
  const [editing, setEditing] = reactExports.useState(null);
  const [creating, setCreating] = reactExports.useState(false);
  const [confirmingId, setConfirmingId] = reactExports.useState(null);
  const [stateErrorId, setStateErrorId] = reactExports.useState(null);
  const [deleteErrorId, setDeleteErrorId] = reactExports.useState(null);
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
  function handleSubmit(input) {
    if (editing) {
      updateProduct.mutate(
        { id: editing.id, patch: input },
        { onSuccess: () => closeForm() }
      );
      return;
    }
    createProduct.mutate(input, { onSuccess: () => closeForm() });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Products",
        description: "Create, edit, order, and publish the products shown on the Ovanite site."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      AdminLayout,
      {
        title: "Products",
        description: "Create, edit, order, and publish the products shown on the public site.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          PrimaryButton,
          {
            type: "button",
            onClick: () => {
              setEditing(null);
              setCreating(true);
            },
            "data-ocid": "admin.products.create_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { "aria-hidden": "true", className: "h-4 w-4" }),
              "New product"
            ]
          }
        ),
        children: [
          formOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 font-display text-lg font-bold tracking-tight", children: editing ? `Edit “${editing.name}”` : "New product" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ProductForm,
              {
                product: editing ?? void 0,
                onSubmit: handleSubmit,
                onCancel: closeForm,
                isPending: activeMutation.isPending,
                errorMessage: activeMutation.isError ? errorText(activeMutation.error) : void 0
              },
              editing ? String(editing.id) : "new"
            )
          ] }) : null,
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "admin.products.loading_state", className: "space-y-3", children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-24 rounded-sm" }, id)) }) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "admin.products.error_state",
              className: "border border-border bg-card p-8",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "We couldn’t load the products." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SecondaryButton,
                  {
                    type: "button",
                    className: "mt-4",
                    onClick: () => void refetch(),
                    "data-ocid": "admin.products.retry_button",
                    children: "Try again"
                  }
                )
              ]
            }
          ) : sorted.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "admin.products.empty_state",
              className: "border border-border bg-card p-10 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "eyebrow", children: "No products" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-display text-2xl font-bold tracking-tight", children: "Add your first product" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-3 max-w-md text-sm text-muted-foreground", children: "Products you create here appear on the public products page once published." }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  PrimaryButton,
                  {
                    type: "button",
                    className: "mt-6",
                    onClick: () => setCreating(true),
                    "data-ocid": "admin.products.empty_create_button",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { "aria-hidden": "true", className: "h-4 w-4" }),
                      "New product"
                    ]
                  }
                )
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "data-ocid": "admin.products.list", className: "space-y-3", children: sorted.map((product, i) => {
            const isPublished = product.state === "published";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "li",
              {
                "data-ocid": `admin.products.item.${i + 1}`,
                className: "border border-border bg-card p-5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 gap-4", children: [
                      hasProductImage(product.imageKey) && product.imageKey ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: product.imageKey.getDirectURL(),
                          alt: `${product.name} logo`,
                          className: "h-12 w-12 shrink-0 rounded-sm border border-border object-cover"
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-dashed border-border font-mono text-xs text-muted-foreground", children: "—" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "truncate font-display text-lg font-bold tracking-tight", children: product.name }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(MicroBadge, { children: isPublished ? "Published" : "Draft" })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 max-w-xl text-sm text-muted-foreground", children: product.description }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                            "Order ",
                            String(product.sortOrder)
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                            "Updated ",
                            formatDate(product.updatedAt)
                          ] }),
                          product.link ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "a",
                            {
                              href: product.link,
                              target: "_blank",
                              rel: "noreferrer",
                              "data-ocid": `admin.products.link.${i + 1}`,
                              className: "inline-flex items-center gap-1 rounded-sm text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              children: [
                                "Visit",
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  ExternalLink,
                                  {
                                    "aria-hidden": "true",
                                    className: "h-3 w-3"
                                  }
                                )
                              ]
                            }
                          ) : null
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SecondaryButton,
                        {
                          type: "button",
                          onClick: () => {
                            setStateErrorId(null);
                            setProductState.mutate(
                              {
                                id: product.id,
                                state: isPublished ? PublishState.draft : PublishState.published
                              },
                              {
                                onError: () => setStateErrorId(product.id)
                              }
                            );
                          },
                          disabled: setProductState.isPending,
                          "data-ocid": `admin.products.publish_toggle.${i + 1}`,
                          children: isPublished ? "Unpublish" : "Publish"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        SecondaryButton,
                        {
                          type: "button",
                          onClick: () => {
                            setCreating(false);
                            setEditing(product);
                          },
                          "data-ocid": `admin.products.edit_button.${i + 1}`,
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { "aria-hidden": "true", className: "h-4 w-4" }),
                            "Edit"
                          ]
                        }
                      ),
                      confirmingId === product.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SecondaryButton,
                          {
                            type: "button",
                            onClick: () => {
                              setDeleteErrorId(null);
                              deleteProduct.mutate(product.id, {
                                onError: () => setDeleteErrorId(product.id)
                              });
                              setConfirmingId(null);
                            },
                            disabled: deleteProduct.isPending,
                            "data-ocid": `admin.products.confirm_delete_button.${i + 1}`,
                            className: "border-destructive/50 text-destructive hover:bg-destructive/10",
                            children: "Confirm delete"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SecondaryButton,
                          {
                            type: "button",
                            onClick: () => setConfirmingId(null),
                            "data-ocid": `admin.products.cancel_delete_button.${i + 1}`,
                            children: "Cancel"
                          }
                        )
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        SecondaryButton,
                        {
                          type: "button",
                          onClick: () => setConfirmingId(product.id),
                          "data-ocid": `admin.products.delete_button.${i + 1}`,
                          className: "text-destructive hover:bg-destructive/10",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { "aria-hidden": "true", className: "h-4 w-4" }),
                            "Delete"
                          ]
                        }
                      )
                    ] })
                  ] }),
                  setProductState.isError && stateErrorId === product.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      role: "alert",
                      "data-ocid": `admin.products.state_error.${i + 1}`,
                      className: "mt-3 text-sm text-destructive",
                      children: errorText(setProductState.error)
                    }
                  ) : null,
                  deleteProduct.isError && deleteErrorId === product.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      role: "alert",
                      "data-ocid": `admin.products.delete_error.${i + 1}`,
                      className: "mt-3 text-sm text-destructive",
                      children: errorText(deleteProduct.error)
                    }
                  ) : null
                ]
              },
              String(product.id)
            );
          }) }),
          !isLoading && !isError && sorted.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-6 flex items-center gap-2 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatusDot, {}),
            "Draft products are hidden from the public site until published."
          ] }) : null
        ]
      }
    )
  ] });
}
export {
  AdminProducts as default
};
