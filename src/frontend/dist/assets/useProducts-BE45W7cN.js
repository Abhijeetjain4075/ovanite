import { f as createLucideIcon, j as jsxRuntimeExports, h as SurfaceCard, g as StatusDot, M as MicroBadge, a as useActor, b as useQuery, d as createActor } from "./index-nAhl1N96.js";
import { s as sectionIndex, h as hasProductImage } from "./format-CdAHKqJe.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M7 7h10v10", key: "1tivn9" }],
  ["path", { d: "M7 17 17 7", key: "1vkiza" }]
];
const ArrowUpRight = createLucideIcon("arrow-up-right", __iconNode);
function monogram(name) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "•";
}
function ProductCard({ product, position, total }) {
  const counter = `${sectionIndex(position)} / ${sectionIndex(total)}`;
  const image = hasProductImage(product.imageKey) ? product.imageKey : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    SurfaceCard,
    {
      interactive: true,
      "data-ocid": `products.item.${position}`,
      className: "flex h-full min-w-0 flex-col",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border px-6 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatusDot, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground", children: "Product" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 font-mono text-xs tracking-[0.16em] text-muted-foreground", children: counter })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col p-6", children: [
          image ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: image.getDirectURL(),
              alt: `${product.name} product logo`,
              loading: "lazy",
              decoding: "async",
              width: 56,
              height: 56,
              className: "mb-6 h-14 w-14 shrink-0 rounded-sm border border-border object-cover"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              "aria-hidden": "true",
              className: "mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-dashed border-border bg-muted/40 font-display text-lg font-bold text-muted-foreground",
              children: monogram(product.name)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "break-words font-display text-xl font-bold tracking-tight", children: product.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 flex-1 text-pretty break-words text-sm leading-relaxed text-muted-foreground", children: product.description }),
          product.link ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: product.link,
              target: "_blank",
              rel: "noreferrer",
              "data-ocid": `products.link.${position}`,
              className: "mt-6 inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              children: [
                "Visit product",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { "aria-hidden": "true", className: "h-4 w-4" })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(MicroBadge, { className: "mt-6 self-start", children: "In development" })
        ] })
      ]
    }
  );
}
const productsQueryKey = ["products", "published"];
function useProducts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: productsQueryKey,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPublishedProducts();
    },
    enabled: !!actor && !isFetching
  });
}
export {
  ProductCard as P,
  useProducts as u
};
