import { e as useSiteContent, j as jsxRuntimeExports, C as Container, S as SecondaryButton, L as Link } from "./index-nAhl1N96.js";
import { B as Breadcrumbs } from "./Breadcrumbs-C4_qKhBm.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { S as Section } from "./Section-CHXUaDCD.js";
import { r as resolveSiteCopy } from "./siteCopy-yL4ekaS-.js";
function About() {
  const { data } = useSiteContent();
  const copy = resolveSiteCopy(data);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "About",
        description: "Ovanite is a software company building products designed to matter. Learn how we work and what we believe."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Breadcrumbs, { items: [{ label: "Home", to: "/" }, { label: "About" }] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { className: "py-16 md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 border-t border-border pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium tracking-[0.22em] text-primary", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "About Ovanite" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 grid gap-10 md:grid-cols-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 md:col-span-7", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-balance break-words font-display text-4xl font-bold tracking-tight md:text-6xl", children: copy.aboutTitle }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 md:col-span-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-pretty break-words text-lg leading-relaxed text-muted-foreground", children: copy.aboutBody }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Section,
      {
        index: "02",
        label: "Philosophy",
        muted: true,
        "data-ocid": "about.philosophy_section",
        className: "border-y border-border",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 md:grid-cols-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 md:col-span-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-balance break-words font-display text-3xl font-bold tracking-tight md:text-4xl", children: copy.philosophyTitle }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 md:col-span-7", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-pretty break-words text-lg leading-relaxed text-muted-foreground", children: copy.philosophyBody }) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { index: "03", label: "Approach", "data-ocid": "about.approach_section", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 md:grid-cols-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 md:col-span-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-balance break-words font-display text-3xl font-bold tracking-tight md:text-4xl", children: copy.approachTitle }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 md:col-span-7", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-pretty break-words text-lg leading-relaxed text-muted-foreground", children: copy.approachBody }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/products", "data-ocid": "about.products_link", children: "Explore products" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", "data-ocid": "about.contact_link", children: "Start a conversation" }) })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  About as default
};
