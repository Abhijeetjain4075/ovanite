import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/products/ProductCard";
import { SecondaryButton } from "@/components/shared/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";

const SKELETON_IDS = Array.from(
  { length: 3 },
  (_, i) => `product-skeleton-${i}`,
);

/** Home products preview: up to three published products, or an empty state. */
export function ProductsPreview() {
  const { data: products, isLoading, isError, refetch } = useProducts();
  const visible = (products ?? []).slice(0, 3);

  return (
    <Section
      index="02"
      label="Products"
      data-ocid="home.products_section"
      className="border-b border-border"
    >
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <h2 className="text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
          Products in development.
        </h2>
        <SecondaryButton asChild>
          <Link to="/products" data-ocid="home.products_link">
            View all products
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </SecondaryButton>
      </div>

      {isLoading ? (
        <div
          data-ocid="home.products_loading_state"
          className="grid gap-6 md:grid-cols-3"
        >
          {SKELETON_IDS.map((id) => (
            <Skeleton key={id} className="h-64 rounded-sm" />
          ))}
        </div>
      ) : isError ? (
        <div
          data-ocid="home.products_error_state"
          className="border border-border bg-card p-8"
        >
          <p className="text-sm text-muted-foreground">
            We couldn&rsquo;t load our products right now.
          </p>
          <SecondaryButton
            type="button"
            className="mt-4"
            onClick={() => void refetch()}
            data-ocid="home.products_retry_button"
          >
            Try again
          </SecondaryButton>
        </div>
      ) : visible.length === 0 ? (
        <div
          data-ocid="home.products_empty_state"
          className="border border-border bg-card p-10 md:p-14"
        >
          <p className="eyebrow">In development</p>
          <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            We are building our first products now. Join the waitlist to hear
            when they launch.
          </p>
          <SecondaryButton asChild className="mt-6">
            <Link to="/waitlist" data-ocid="home.products_waitlist_link">
              Join the waitlist
            </Link>
          </SecondaryButton>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {visible.map((product, i) => (
            <ProductCard
              key={String(product.id)}
              product={product}
              position={i + 1}
              total={visible.length}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
