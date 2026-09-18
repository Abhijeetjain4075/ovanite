import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

export type Crumb = {
  label: string;
  /** Omit `to` for the current page (rendered as plain text). */
  to?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
  className?: string;
};

/**
 * Breadcrumb trail reflecting the page hierarchy. The final crumb is the
 * current page and is not a link.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      data-ocid="breadcrumbs"
      className={cn("border-b border-border bg-muted/30", className)}
    >
      <Container>
        <ol className="flex flex-wrap items-center gap-2 py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.label} className="flex items-center gap-2">
                {i > 0 ? (
                  <ChevronRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 opacity-50"
                  />
                ) : null}
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="text-foreground"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </nav>
  );
}
