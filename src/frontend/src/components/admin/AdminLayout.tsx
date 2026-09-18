import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { Container } from "@/components/layout/Container";
import { useAdmin } from "@/hooks/useAdmin";

type AdminLayoutProps = {
  title: string;
  description: string;
  /** Optional primary action rendered in the page header. */
  action?: ReactNode;
  children: ReactNode;
};

/**
 * Shared shell for every admin page: a mono eyebrow, page title, optional
 * primary action, and the section navigation rail beside the content.
 */
export function AdminLayout({
  title,
  description,
  action,
  children,
}: AdminLayoutProps) {
  const { data: admin } = useAdmin();

  return (
    <Container className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6 border-t border-border pt-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="md:sticky md:top-24 md:self-start">
          <AdminNav />
          {admin ? (
            <p className="mt-4 hidden break-all px-4 font-mono text-[0.6875rem] leading-relaxed text-muted-foreground md:block">
              {admin.isOwner ? "Owner" : "Admin"} · {admin.principal.toText()}
            </p>
          ) : null}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
