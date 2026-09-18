import { j as jsxRuntimeExports, C as Container, c as cn } from "./index-nAhl1N96.js";
function Section({
  index,
  label,
  muted = false,
  contained = true,
  className,
  children,
  ...props
}) {
  const head = index || label ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-10 md:mb-14", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 border-t border-border pt-4", children: [
    index ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium tracking-[0.22em] text-primary", children: index }) : null,
    label ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: label }) : null
  ] }) }) : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "section",
    {
      className: cn("py-20 md:py-28", muted && "bg-muted/40", className),
      ...props,
      children: contained ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { children: [
        head,
        children
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        head ? /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { children: head }) : null,
        children
      ] })
    }
  );
}
export {
  Section as S
};
