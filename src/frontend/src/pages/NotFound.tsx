import { Link } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { PrimaryButton, SecondaryButton } from "@/components/shared/primitives";

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="Page not found"
        description="The page you were looking for does not exist. Return to the Ovanite home page or explore our products."
      />
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Not found" }]}
      />
      <Container className="py-24 md:py-36">
        <div className="mx-auto min-w-0 max-w-xl">
          <p className="eyebrow">Error 404</p>
          <h1 className="mt-5 text-balance break-words font-display text-5xl font-bold tracking-tight md:text-6xl">
            This page doesn&rsquo;t exist.
          </h1>
          <p className="mt-6 text-pretty break-words text-lg leading-relaxed text-muted-foreground">
            The link may be broken, or the page may have moved. Let&rsquo;s get
            you back to something useful.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <PrimaryButton asChild size="lg">
              <Link to="/" data-ocid="not_found.home_button">
                Back to home
              </Link>
            </PrimaryButton>
            <SecondaryButton asChild size="lg">
              <Link to="/products" data-ocid="not_found.products_button">
                Explore products
              </Link>
            </SecondaryButton>
          </div>
        </div>
      </Container>
    </>
  );
}
