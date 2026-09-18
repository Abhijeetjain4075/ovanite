import { f as createLucideIcon, j as jsxRuntimeExports, C as Container, L as Link, c as cn } from "./index-nAhl1N96.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]];
const ChevronRight = createLucideIcon("chevron-right", __iconNode);
function Breadcrumbs({ items, className }) {
  if (items.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "nav",
    {
      "aria-label": "Breadcrumb",
      "data-ocid": "breadcrumbs",
      className: cn("border-b border-border bg-muted/30", className),
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "flex flex-wrap items-center gap-2 py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground", children: items.map((item, i) => {
        const isLast = i === items.length - 1;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
          i > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            ChevronRight,
            {
              "aria-hidden": "true",
              className: "h-3.5 w-3.5 shrink-0 opacity-50"
            }
          ) : null,
          item.to && !isLast ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: item.to,
              className: "rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              children: item.label
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              "aria-current": isLast ? "page" : void 0,
              className: "text-foreground",
              children: item.label
            }
          )
        ] }, item.label);
      }) }) })
    }
  );
}
export {
  Breadcrumbs as B
};
