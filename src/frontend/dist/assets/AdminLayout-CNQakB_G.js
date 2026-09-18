import { j as jsxRuntimeExports, N as NavLink, c as cn, v as useAdmin, C as Container } from "./index-nAhl1N96.js";
const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", to: "/admin", end: true },
  { label: "Products", to: "/admin/products" },
  { label: "FAQs", to: "/admin/faqs" },
  { label: "Site Copy", to: "/admin/site-copy" },
  { label: "Submissions", to: "/admin/submissions" },
  { label: "Team", to: "/admin/team" }
];
const linkClass = ({ isActive }) => cn(
  "flex min-h-[44px] items-center rounded-sm border-l-2 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  isActive ? "border-primary bg-muted/60 text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
);
function AdminNav() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "nav",
    {
      "aria-label": "Admin sections",
      "data-ocid": "admin.nav",
      className: "border-b border-border bg-card md:border-b-0 md:border-r",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible md:p-4", children: ADMIN_NAV_ITEMS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        NavLink,
        {
          to: item.to,
          end: item.end,
          "data-ocid": `admin.nav.${item.label.toLowerCase().replace(/\s+/g, "_")}_link`,
          className: linkClass,
          children: item.label
        },
        item.to
      )) })
    }
  );
}
function AdminLayout({
  title,
  description,
  action,
  children
}) {
  const { data: admin } = useAdmin();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { className: "py-10 md:py-14", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-6 border-t border-border pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "eyebrow", children: "Admin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground", children: description })
      ] }),
      action ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0", children: action }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 grid gap-8 md:grid-cols-[220px_minmax(0,1fr)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:sticky md:top-24 md:self-start", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AdminNav, {}),
        admin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 hidden break-all px-4 font-mono text-[0.6875rem] leading-relaxed text-muted-foreground md:block", children: [
          admin.isOwner ? "Owner" : "Admin",
          " · ",
          admin.principal.toText()
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0", children })
    ] })
  ] });
}
export {
  AdminLayout as A
};
