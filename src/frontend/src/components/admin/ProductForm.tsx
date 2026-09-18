import { ExternalBlob } from "@caffeineai/object-storage";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { PrimaryButton, SecondaryButton } from "@/components/shared/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product, ProductInput } from "@/types/content";

type ProductFormProps = {
  /** Existing product when editing; omit to create. */
  product?: Product;
  onSubmit: (input: ProductInput) => void;
  onCancel: () => void;
  isPending: boolean;
  errorMessage?: string;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * A zero-byte blob used to clear a stored image. The backend's `mergeBlob`
 * treats `null` as "leave untouched", so clearing requires an explicit blob.
 * Consumers treat a zero-byte blob as "no image" (see `hasProductImage`) and
 * render their fallback instead of a broken `<img>`.
 */
function emptyBlob(): ExternalBlob {
  return ExternalBlob.fromBytes(new Uint8Array(0), "application/octet-stream");
}

function parseSortOrder(value: string): bigint {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0n;
  return BigInt(parsed);
}

/**
 * Create/edit form for a product. The selected image is held as an
 * `ExternalBlob` and passed through `createProduct`/`updateProduct` as
 * `imageKey`, which is what actually uploads the bytes to object storage.
 */
export function ProductForm({
  product,
  onSubmit,
  onCancel,
  isPending,
  errorMessage,
}: ProductFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [link, setLink] = useState(product?.link ?? "");
  const [sortOrder, setSortOrder] = useState(
    product ? String(product.sortOrder) : "0",
  );
  const [image, setImage] = useState<ExternalBlob | null>(
    product?.imageKey ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const nameError = name.trim() === "" ? "A product name is required." : null;
  const descriptionError =
    description.trim() === "" ? "A description is required." : null;

  const previewUrl = image ? image.getDirectURL() : null;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nameError || descriptionError || uploading) return;
    // The backend's mergeBlob treats `undefined` as "leave the stored value
    // untouched", so clearing an image must send an explicit empty blob. The
    // public and admin cards read that zero-byte blob as "no image".
    const imageKey = image ?? (product?.imageKey ? emptyBlob() : undefined);
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      link: link.trim(),
      imageKey,
      sortOrder: parseSortOrder(sortOrder),
    });
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      data-ocid="admin.product_form"
      className="space-y-6 border border-border bg-card p-6 md:p-8"
    >
      <div>
        <Label htmlFor="product-name" className="mb-2">
          Name
        </Label>
        <Input
          id="product-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "product-name-error" : undefined}
          data-ocid="admin.product.name_input"
          className="h-11 rounded-sm"
        />
        {nameError ? (
          <p
            id="product-name-error"
            role="alert"
            data-ocid="admin.product.name_error"
            className="mt-2 text-sm text-destructive"
          >
            {nameError}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="product-description" className="mb-2">
          Description
        </Label>
        <Textarea
          id="product-description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={descriptionError ? true : undefined}
          aria-describedby={
            descriptionError ? "product-description-error" : undefined
          }
          data-ocid="admin.product.description_textarea"
          className="min-h-28 rounded-sm"
        />
        {descriptionError ? (
          <p
            id="product-description-error"
            role="alert"
            data-ocid="admin.product.description_error"
            className="mt-2 text-sm text-destructive"
          >
            {descriptionError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="product-link" className="mb-2">
            Link <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="product-link"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            data-ocid="admin.product.link_input"
            className="h-11 rounded-sm"
          />
        </div>
        <div>
          <Label htmlFor="product-sort-order" className="mb-2">
            Order
          </Label>
          <Input
            id="product-sort-order"
            type="number"
            min={0}
            inputMode="numeric"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            data-ocid="admin.product.sort_order_input"
            className="h-11 rounded-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Lower numbers appear first.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="product-image" className="mb-2">
          Image / logo <span className="text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex flex-wrap items-center gap-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Product preview"
              className="h-16 w-16 rounded-sm border border-border object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-dashed border-border text-muted-foreground">
              <ImagePlus aria-hidden="true" className="h-5 w-5" />
            </div>
          )}
          <input
            ref={fileInputRef}
            id="product-image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
            data-ocid="admin.product.image_input"
          />
          <SecondaryButton
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-ocid="admin.product.upload_button"
          >
            {uploading ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              "Upload image"
            )}
          </SecondaryButton>
          {previewUrl ? (
            <SecondaryButton
              type="button"
              onClick={() => setImage(null)}
              data-ocid="admin.product.remove_image_button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Remove
            </SecondaryButton>
          ) : null}
        </div>
        {uploadError ? (
          <p
            role="alert"
            data-ocid="admin.product.upload_error"
            className="mt-2 text-sm text-destructive"
          >
            {uploadError}
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <p
          role="alert"
          data-ocid="admin.product.form_error"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <PrimaryButton
          type="submit"
          disabled={isPending || uploading}
          data-ocid="admin.product.submit_button"
        >
          {isPending ? "Saving…" : product ? "Save changes" : "Create product"}
        </PrimaryButton>
        <SecondaryButton
          type="button"
          onClick={onCancel}
          disabled={isPending}
          data-ocid="admin.product.cancel_button"
        >
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}
