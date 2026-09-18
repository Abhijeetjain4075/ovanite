import { m as useLocation, j as jsxRuntimeExports, C as Container, P as PrimaryButton, L as Link, S as SecondaryButton } from "./index-nAhl1N96.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { A as ArrowRight } from "./arrow-right-icfR0l-3.js";
function ThankYou() {
  const location = useLocation();
  const state = location.state;
  const isWaitlist = (state == null ? void 0 : state.kind) === "waitlist";
  const heading = isWaitlist ? "You're on the list." : "Thank you for reaching out.";
  const body = isWaitlist ? "We have your details and will be in touch when there is something real to share. No noise in between." : "We have received your message and will reply as soon as we can. In the meantime, feel free to explore what we are building.";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Thank you",
        description: "Thank you for getting in touch with Ovanite. We have received your submission."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { className: "py-24 md:py-36", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto min-w-0 max-w-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 border-t border-border pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium tracking-[0.22em] text-primary", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "Confirmation" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "h1",
        {
          "data-ocid": "thank_you.heading",
          className: "mt-10 text-balance break-words font-display text-4xl font-bold tracking-tight md:text-6xl",
          children: heading
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-pretty break-words text-lg leading-relaxed text-muted-foreground", children: body }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryButton, { asChild: true, size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/products", "data-ocid": "thank_you.products_button", children: [
          "Explore products",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { "aria-hidden": "true", className: "h-4 w-4" })
        ] }) }),
        isWaitlist ? /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", "data-ocid": "thank_you.contact_button", children: "Send us a message" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", "data-ocid": "thank_you.home_button", children: "Back to home" }) })
      ] })
    ] }) })
  ] });
}
export {
  ThankYou as default
};
