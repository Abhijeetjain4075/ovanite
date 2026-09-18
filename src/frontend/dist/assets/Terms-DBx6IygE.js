import { e as useSiteContent, j as jsxRuntimeExports, C as Container } from "./index-nAhl1N96.js";
import { B as Breadcrumbs } from "./Breadcrumbs-C4_qKhBm.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { r as resolveSiteCopy } from "./siteCopy-yL4ekaS-.js";
function toParagraphs(body) {
  return body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter((paragraph) => paragraph.length > 0);
}
function Terms() {
  const { data } = useSiteContent();
  const copy = resolveSiteCopy(data);
  const paragraphs = toParagraphs(copy.termsBody);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Terms",
        description: "The terms that govern your use of the Ovanite website and its content."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Breadcrumbs, { items: [{ label: "Home", to: "/" }, { label: "Terms" }] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { className: "py-16 md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 border-t border-border pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium tracking-[0.22em] text-primary", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "Legal" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 min-w-0 max-w-3xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-balance break-words font-display text-4xl font-bold tracking-tight md:text-5xl", children: "Terms of Use" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 space-y-5 text-pretty break-words text-lg leading-relaxed text-muted-foreground", children: paragraphs.map((paragraph) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: paragraph }, paragraph)) })
      ] })
    ] })
  ] });
}
export {
  Terms as default
};
