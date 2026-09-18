import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AdminGate } from "@/components/layout/AdminGate";
import { RouteFallback } from "@/components/layout/RouteFallback";
import { SiteLayout } from "@/components/layout/SiteLayout";

const Home = lazy(() => import("@/pages/Home"));
const Products = lazy(() => import("@/pages/Products"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Waitlist = lazy(() => import("@/pages/Waitlist"));
const ThankYou = lazy(() => import("@/pages/ThankYou"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminFaqs = lazy(() => import("@/pages/admin/AdminFaqs"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminSiteCopy = lazy(() => import("@/pages/admin/AdminSiteCopy"));
const AdminSubmissions = lazy(() => import("@/pages/admin/AdminSubmissions"));
const AdminTeam = lazy(() => import("@/pages/admin/AdminTeam"));

/**
 * Router and route table only. Page bodies live in `src/pages/*` and are
 * rendered inside `SiteLayout`; admin routes are wrapped in `AdminGate`.
 *
 * Every page is code-split with `React.lazy`, so the initial bundle carries
 * only the shell plus the first route's chunk. Route paths and URLs are
 * unchanged.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route
              path="/admin/*"
              element={
                <AdminGate>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="faqs" element={<AdminFaqs />} />
                    <Route path="site-copy" element={<AdminSiteCopy />} />
                    <Route path="submissions" element={<AdminSubmissions />} />
                    <Route path="team" element={<AdminTeam />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AdminGate>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
