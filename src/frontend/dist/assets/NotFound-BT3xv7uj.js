import { j as jsxRuntimeExports, C as Container, P as PrimaryButton, L as Link, S as SecondaryButton } from "./index-nAhl1N96.js";
import { B as Breadcrumbs } from "./Breadcrumbs-C4_qKhBm.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
function NotFound() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Page not found",
        description: "The page you were looking for does not exist. Return to the Ovanite home page or explore our products."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Breadcrumbs,
      {
        items: [{ label: "Home", to: "/" }, { label: "Not found" }]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { className: "py-24 md:py-36", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto min-w-0 max-w-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "eyebrow", children: "Error 404" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-5 text-balance break-words font-display text-5xl font-bold tracking-tight md:text-6xl", children: "This page doesn’t exist." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-pretty break-words text-lg leading-relaxed text-muted-foreground", children: "The link may be broken, or the page may have moved. Let’s get you back to something useful." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryButton, { asChild: true, size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", "data-ocid": "not_found.home_button", children: "Back to home" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/products", "data-ocid": "not_found.products_button", children: "Explore products" }) })
      ] })
    ] }) })
  ] });
}
export {
  NotFound as default
};
