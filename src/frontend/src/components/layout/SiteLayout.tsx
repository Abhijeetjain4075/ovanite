import { Outlet } from "react-router-dom";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

/**
 * The public site shell: skip link, sticky navbar, routed content, footer.
 * Every public route renders inside this layout.
 */
export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
