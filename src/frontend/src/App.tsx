import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AdminGate } from "@/components/layout/AdminGate";
import { SiteLayout } from "@/components/layout/SiteLayout";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Privacy from "@/pages/Privacy";
import Products from "@/pages/Products";
import Terms from "@/pages/Terms";
import ThankYou from "@/pages/ThankYou";
import Waitlist from "@/pages/Waitlist";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminFaqs from "@/pages/admin/AdminFaqs";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminSiteCopy from "@/pages/admin/AdminSiteCopy";
import AdminSubmissions from "@/pages/admin/AdminSubmissions";
import AdminTeam from "@/pages/admin/AdminTeam";

/**
 * Router and route table only. Page bodies live in `src/pages/*` and are
 * rendered inside `SiteLayout`; admin routes are wrapped in `AdminGate`.
 */
export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
