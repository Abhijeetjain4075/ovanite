import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

export type AdminNavItem = {
  label: string;
  to: string;
  /** Match nested routes (e.g. /admin/products/new) as active. */
  end?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin", end: true },
  { label: "Products", to: "/admin/products" },
  { label: "FAQs", to: "/admin/faqs" },
  { label: "Site Copy", to: "/admin/site-copy" },
  { label: "Submissions", to: "/admin/submissions" },
  { label: "Team", to: "/admin/team" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-[44px] items-center rounded-sm border-l-2 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isActive
      ? "border-primary bg-muted/60 text-foreground"
      : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
  );

/**
 * Admin section navigation. Renders as a vertical rail on desktop and a
 * horizontally scrollable tab strip on smaller screens.
 */
export function AdminNav() {
  return (
    <nav
      aria-label="Admin sections"
      data-ocid="admin.nav"
      className="border-b border-border bg-card md:border-b-0 md:border-r"
    >
      <div className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible md:p-4">
        {ADMIN_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-ocid={`admin.nav.${item.label.toLowerCase().replace(/\s+/g, "_")}_link`}
            className={linkClass}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
