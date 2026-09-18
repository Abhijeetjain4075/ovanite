import { ArrowRight, Compass, Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { ProductCard } from "@/components/products/ProductCard";
import {
  MicroBadge,
  PrimaryButton,
  SecondaryButton,
  StatusDot,
} from "@/components/shared/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";

const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, i) => `products-skeleton-${i}`,
);

/** The three commitments shown beside the "in development" empty state. */
const DEVELOPMENT_NOTES = [
  {
    index: "01",
    title: "Designed before it is built",
    body: "Every product starts as a written problem and a considered interface, not a feature list.",
  },
  {
    index: "02",
    title: "Built to be maintained",
    body: "We ship software we intend to keep running, so durability is a requirement from day one.",
  },
  {
    index: "03",
    title: "Published when it is ready",
    body: "Products appear here the moment they are released. Nothing is announced before it works.",
  },
];

export default function Products() {
  const { data: products, isLoading, isError, refetch } = useProducts();
  const visible = products ?? [];

  return (
    <>
      <PageMeta
        title="Products"
        description="Explore the software products Ovanite has published, and see what is currently in development."
      />
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Products" }]}
      />

      <Container className="py-16 md:py-24">
        <div className="flex items-baseline gap-3 border-t border-border pt-4">
          <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
            01
          </span>
          <span className="eyebrow">Products</span>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <h1 className="text-balance font-display text-4xl font-bold tracking-tight md:text-6xl">
              Products in the field.
            </h1>
          </div>
          <div className="md:col-span-5">
            <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Every product below is designed, built, and maintained by Ovanite.
              Follow the links to see them in use.
            </p>
          </div>
        </div>

        <div className="mt-16">
          {isLoading ? (
            <div
              aria-busy="true"
              data-ocid="products.loading_state"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              <span className="sr-only">Loading products…</span>
              {SKELETON_IDS.map((id) => (
                <Skeleton key={id} className="h-64 rounded-sm" />
              ))}
            </div>
          ) : isError ? (
            <div
              role="alert"
              data-ocid="products.error_state"
              className="border border-border bg-card p-10 md:p-14"
            >
              <div className="flex items-center gap-2">
                <StatusDot className="bg-destructive" />
                <span className="eyebrow">Something went wrong</span>
              </div>
              <h2 className="mt-5 max-w-2xl text-balance font-display text-2xl font-bold tracking-tight md:text-3xl">
                We couldn&rsquo;t load our products.
              </h2>
              <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
                This is usually temporary. Try again, or reach out and we will
                help directly.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton
                  type="button"
                  onClick={() => void refetch()}
                  data-ocid="products.retry_button"
                >
                  Try again
                </PrimaryButton>
                <SecondaryButton asChild>
                  <Link to="/contact" data-ocid="products.error_contact_link">
                    Contact us
                  </Link>
                </SecondaryButton>
              </div>
            </div>
          ) : visible.length === 0 ? (
            <div
              data-ocid="products.empty_state"
              className="border border-border bg-card"
            >
              <div className="grid gap-10 p-8 md:grid-cols-12 md:gap-12 md:p-14">
                <div className="md:col-span-7">
                  <div className="flex items-center gap-2">
                    <StatusDot />
                    <span className="eyebrow">Products in development</span>
                  </div>
                  <h2 className="mt-6 max-w-2xl text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
                    Our first products are on the way.
                  </h2>
                  <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                    We are building now. Each product will be published here the
                    moment it ships, with a direct link to use it. Join the
                    waitlist to be the first to know.
                  </p>
                  <div className="mt-9 flex flex-wrap gap-3">
                    <PrimaryButton asChild>
                      <Link to="/waitlist" data-ocid="products.waitlist_link">
                        Join the waitlist
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </PrimaryButton>
                    <SecondaryButton asChild>
                      <Link to="/contact" data-ocid="products.contact_link">
                        Start a conversation
                      </Link>
                    </SecondaryButton>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <div className="border border-border bg-muted/40 p-6">
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                      <span className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        How we work
                      </span>
                      <MicroBadge>In progress</MicroBadge>
                    </div>
                    <ul className="mt-5 space-y-5">
                      {DEVELOPMENT_NOTES.map((note) => (
                        <li key={note.index} className="flex gap-4">
                          <span className="mt-0.5 shrink-0 font-mono text-xs font-medium tracking-[0.16em] text-primary">
                            {note.index}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-display text-sm font-bold tracking-tight">
                              {note.title}
                            </h3>
                            <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                              {note.body}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border px-8 py-5 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground md:px-14">
                <span className="inline-flex items-center gap-2">
                  <Compass aria-hidden="true" className="h-3.5 w-3.5" />
                  Publishing as we ship
                </span>
                <span className="inline-flex items-center gap-2">
                  <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                  Waitlist opens first
                </span>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </Container>
    </>
  );
}
