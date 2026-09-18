import { ArrowUpRight } from "lucide-react";

import {
  MicroBadge,
  StatusDot,
  SurfaceCard,
} from "@/components/shared/primitives";
import { hasProductImage, sectionIndex } from "@/lib/format";
import type { Product } from "@/types/content";

type ProductCardProps = {
  product: Product;
  /** 1-based position used for the mono index counter. */
  position: number;
  total: number;
};

/** First letter of the product name, used as the no-image monogram. */
function monogram(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "•";
}

/**
 * A published product entry: media/logo, name, description, and an external
 * link when one is provided. Cards follow media → title → metadata → action.
 *
 * The image is gated on `hasProductImage` because the backend clears an image
 * by storing a zero-byte blob, which is truthy and would otherwise render a
 * broken `<img>`.
 */
export function ProductCard({ product, position, total }: ProductCardProps) {
  const counter = `${sectionIndex(position)} / ${sectionIndex(total)}`;
  const image = hasProductImage(product.imageKey) ? product.imageKey : null;

  return (
    <SurfaceCard
      interactive
      data-ocid={`products.item.${position}`}
      className="flex h-full min-w-0 flex-col"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot />
          <span className="truncate font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Product
          </span>
        </div>
        <span className="shrink-0 font-mono text-xs tracking-[0.16em] text-muted-foreground">
          {counter}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-6">
        {image ? (
          <img
            src={image.getDirectURL()}
            alt={`${product.name} product logo`}
            loading="lazy"
            decoding="async"
            className="mb-6 h-14 w-14 shrink-0 rounded-sm border border-border object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-dashed border-border bg-muted/40 font-display text-lg font-bold text-muted-foreground"
          >
            {monogram(product.name)}
          </div>
        )}

        <h3 className="break-words font-display text-xl font-bold tracking-tight">
          {product.name}
        </h3>
        <p className="mt-3 flex-1 text-pretty break-words text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        {product.link ? (
          <a
            href={product.link}
            target="_blank"
            rel="noreferrer"
            data-ocid={`products.link.${position}`}
            className="mt-6 inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Visit product
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        ) : (
          <MicroBadge className="mt-6 self-start">In development</MicroBadge>
        )}
      </div>
    </SurfaceCard>
  );
}
