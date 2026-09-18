import { n as useAdminTeam, e as useSiteContent, o as SubmissionStatus, j as jsxRuntimeExports, h as SurfaceCard, L as Link } from "./index-nAhl1N96.js";
import { A as AdminLayout } from "./AdminLayout-CNQakB_G.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { S as Skeleton } from "./skeleton-BTXYXnLQ.js";
import { u as useAdminFaqs } from "./useAdminFaqs-DvZVyMrv.js";
import { u as useAdminProducts } from "./useAdminProducts-DMOkphpd.js";
import { u as useAdminSubmissions } from "./useAdminSubmissions-CMn0QApc.js";
import { f as formatDateTime } from "./format-CdAHKqJe.js";
import { A as ArrowRight } from "./arrow-right-icfR0l-3.js";
const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `admin-dashboard-skeleton-${i}`
);
const SUBMISSION_KIND_LABELS = {
  contact: "Contact",
  waitlist: "Waitlist"
};
function submissionKindLabel(kind) {
  return SUBMISSION_KIND_LABELS[kind] ?? kind;
}
function AdminDashboard() {
  const products = useAdminProducts();
  const faqs = useAdminFaqs();
  const submissions = useAdminSubmissions({});
  const team = useAdminTeam();
  const siteContent = useSiteContent();
  const isLoading = products.isLoading || faqs.isLoading || submissions.isLoading || team.isLoading || siteContent.isLoading;
  const productList = products.data ?? [];
  const faqList = faqs.data ?? [];
  const submissionList = submissions.data ?? [];
  const teamList = team.data ?? [];
  const publishedProducts = productList.filter(
    (product) => product.state === "published"
  ).length;
  const publishedFaqs = faqList.filter(
    (faq) => faq.state === "published"
  ).length;
  const unreadSubmissions = submissionList.filter(
    (submission) => submission.status === SubmissionStatus.new_
  ).length;
  const stats = [
    {
      label: "Products",
      value: String(productList.length),
      detail: `${publishedProducts} published`,
      to: "/admin/products",
      ocid: "admin.dashboard.products_card"
    },
    {
      label: "FAQs",
      value: String(faqList.length),
      detail: `${publishedFaqs} published`,
      to: "/admin/faqs",
      ocid: "admin.dashboard.faqs_card"
    },
    {
      label: "Submissions",
      value: String(submissionList.length),
      detail: `${unreadSubmissions} unread`,
      to: "/admin/submissions",
      ocid: "admin.dashboard.submissions_card"
    },
    {
      label: "Team",
      value: String(teamList.length),
      detail: "Admins with access",
      to: "/admin/team",
      ocid: "admin.dashboard.team_card"
    }
  ];
  const recent = submissionList.slice(0, 5);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Admin",
        description: "Manage Ovanite products, FAQs, site copy, submissions, and team access."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AdminLayout,
      {
        title: "Dashboard",
        description: "An overview of the content, submissions, and access that power the Ovanite site.",
        children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "admin.dashboard.loading_state",
            className: "grid gap-4 sm:grid-cols-2",
            children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-32 rounded-sm" }, id))
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: stats.map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            SurfaceCard,
            {
              interactive: true,
              "data-ocid": stat.ocid,
              className: "p-6",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Link,
                {
                  to: stat.to,
                  className: "flex items-start justify-between gap-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "eyebrow", children: stat.label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 font-display text-4xl font-bold tracking-tight", children: stat.value }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: stat.detail })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      ArrowRight,
                      {
                        "aria-hidden": "true",
                        className: "mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                      }
                    )
                  ]
                }
              )
            },
            stat.label
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border bg-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 border-b border-border px-6 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-bold tracking-tight", children: "Recent submissions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Link,
                {
                  to: "/admin/submissions",
                  "data-ocid": "admin.dashboard.view_submissions_link",
                  className: "rounded-sm text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  children: "View all"
                }
              )
            ] }),
            recent.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                "data-ocid": "admin.dashboard.submissions_empty_state",
                className: "px-6 py-10 text-sm text-muted-foreground",
                children: "No submissions yet. Contact and waitlist entries will appear here."
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "data-ocid": "admin.dashboard.submissions_list", children: recent.map((submission, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "li",
              {
                "data-ocid": `admin.dashboard.submission_item.${i + 1}`,
                className: "flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-b-0",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: submission.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: submission.email })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground", children: submissionKindLabel(submission.kind) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs text-muted-foreground", children: formatDateTime(submission.createdAt) })
                  ] })
                ]
              },
              String(submission.id)
            )) })
          ] })
        ] })
      }
    )
  ] });
}
export {
  AdminDashboard as default
};
