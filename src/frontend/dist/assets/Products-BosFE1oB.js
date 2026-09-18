import { f as createLucideIcon, j as jsxRuntimeExports, C as Container, g as StatusDot, P as PrimaryButton, S as SecondaryButton, L as Link, M as MicroBadge } from "./index-nAhl1N96.js";
import { B as Breadcrumbs } from "./Breadcrumbs-C4_qKhBm.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { u as useProducts, P as ProductCard } from "./useProducts-BE45W7cN.js";
import { S as Skeleton } from "./skeleton-BTXYXnLQ.js";
import { A as ArrowRight } from "./arrow-right-icfR0l-3.js";
import { M as Mail } from "./mail-C5X0p1tP.js";
import "./format-CdAHKqJe.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
      key: "9ktpf1"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
];
const Compass = createLucideIcon("compass", __iconNode);
const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, i) => `products-skeleton-${i}`
);
const DEVELOPMENT_NOTES = [
  {
    index: "01",
    title: "Designed before it is built",
    body: "Every product starts as a written problem and a considered interface, not a feature list."
  },
  {
    index: "02",
    title: "Built to be maintained",
    body: "We ship software we intend to keep running, so durability is a requirement from day one."
  },
  {
    index: "03",
    title: "Published when it is ready",
    body: "Products appear here the moment they are released. Nothing is announced before it works."
  }
];
function Products() {
  const { data: products, isLoading, isError, refetch } = useProducts();
  const visible = products ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Products",
        description: "Explore the software products Ovanite has published, and see what is currently in development."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Breadcrumbs,
      {
        items: [{ label: "Home", to: "/" }, { label: "Products" }]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { className: "py-16 md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 border-t border-border pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium tracking-[0.22em] text-primary", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "Products" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 grid gap-10 md:grid-cols-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-7", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-balance font-display text-4xl font-bold tracking-tight md:text-6xl", children: "Products in the field." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-pretty text-lg leading-relaxed text-muted-foreground", children: "Every product below is designed, built, and maintained by Ovanite. Follow the links to see them in use." }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-16", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "aria-busy": "true",
          "data-ocid": "products.loading_state",
          className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Loading products…" }),
            SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-64 rounded-sm" }, id))
          ]
        }
      ) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          role: "alert",
          "data-ocid": "products.error_state",
          className: "border border-border bg-card p-10 md:p-14",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusDot, { className: "bg-destructive" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "Something went wrong" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-5 max-w-2xl text-balance font-display text-2xl font-bold tracking-tight md:text-3xl", children: "We couldn’t load our products." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground", children: "This is usually temporary. Try again, or reach out and we will help directly." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PrimaryButton,
                {
                  type: "button",
                  onClick: () => void refetch(),
                  "data-ocid": "products.retry_button",
                  children: "Try again"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", "data-ocid": "products.error_contact_link", children: "Contact us" }) })
            ] })
          ]
        }
      ) : visible.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "products.empty_state",
          className: "border border-border bg-card",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 p-8 md:grid-cols-12 md:gap-12 md:p-14", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-7", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(StatusDot, {}),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "Products in development" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-6 max-w-2xl text-balance font-display text-3xl font-bold tracking-tight md:text-4xl", children: "Our first products are on the way." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground", children: "We are building now. Each product will be published here the moment it ships, with a direct link to use it. Join the waitlist to be the first to know." }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-9 flex flex-wrap gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryButton, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/waitlist", "data-ocid": "products.waitlist_link", children: [
                    "Join the waitlist",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { "aria-hidden": "true", className: "h-4 w-4" })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", "data-ocid": "products.contact_link", children: "Start a conversation" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border bg-muted/40 p-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border pb-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground", children: "How we work" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MicroBadge, { children: "In progress" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-5 space-y-5", children: DEVELOPMENT_NOTES.map((note) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 shrink-0 font-mono text-xs font-medium tracking-[0.16em] text-primary", children: note.index }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-bold tracking-tight", children: note.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-pretty text-sm leading-relaxed text-muted-foreground", children: note.body })
                  ] })
                ] }, note.index)) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border px-8 py-5 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground md:px-14", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Compass, { "aria-hidden": "true", className: "h-3.5 w-3.5" }),
                "Publishing as we ship"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { "aria-hidden": "true", className: "h-3.5 w-3.5" }),
                "Waitlist opens first"
              ] })
            ] })
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: visible.map((product, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        ProductCard,
        {
          product,
          position: i + 1,
          total: visible.length
        },
        String(product.id)
      )) }) })
    ] })
  ] });
}
export {
  Products as default
};
