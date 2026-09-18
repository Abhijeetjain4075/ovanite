import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { OvaniteWordmark } from "@/components/brand/OvaniteMark";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Products", to: "/products" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Waitlist", to: "/waitlist" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { data: admin } = useAdmin();

  // Escape closes the menu and restores focus to the toggle.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative rounded-sm px-1 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      isActive
        ? "text-foreground after:absolute after:inset-x-1 after:-bottom-px after:h-px after:bg-primary"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container>
        <div className="flex h-[72px] items-center justify-between gap-6">
          <Link
            to="/"
            data-ocid="nav.home_link"
            aria-label="Ovanite — home"
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <OvaniteWordmark />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 md:flex"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                data-ocid={`nav.${link.label.toLowerCase()}_link`}
                className={linkClass}
              >
                {link.label}
              </NavLink>
            ))}
            {admin ? (
              <NavLink
                to="/admin"
                data-ocid="nav.admin_link"
                className={linkClass}
              >
                Admin
              </NavLink>
            ) : null}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button asChild size="sm" className="rounded-sm">
              <Link to="/products" data-ocid="nav.explore_products_button">
                Explore products
              </Link>
            </Button>
          </div>

          <button
            ref={toggleRef}
            type="button"
            data-ocid="nav.mobile_menu_toggle"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
          >
            {open ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </Container>

      <div
        id={menuId}
        hidden={!open}
        className="border-t border-border bg-background md:hidden"
      >
        <Container>
          <nav aria-label="Mobile" className="flex flex-col py-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                data-ocid={`nav.mobile.${link.label.toLowerCase()}_link`}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-[44px] items-center border-b border-border/60 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    isActive
                      ? "border-l-2 border-l-primary pl-3 text-foreground"
                      : "text-muted-foreground",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            {admin ? (
              <NavLink
                to="/admin"
                data-ocid="nav.mobile.admin_link"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-[44px] items-center border-b border-border/60 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    isActive
                      ? "border-l-2 border-l-primary pl-3 text-foreground"
                      : "text-muted-foreground",
                  )
                }
              >
                Admin
              </NavLink>
            ) : null}
            <Button asChild size="lg" className="mt-5 rounded-sm">
              <Link
                to="/products"
                data-ocid="nav.mobile.explore_products_button"
                onClick={() => setOpen(false)}
              >
                Explore products
              </Link>
            </Button>
          </nav>
        </Container>
      </div>
    </header>
  );
}
