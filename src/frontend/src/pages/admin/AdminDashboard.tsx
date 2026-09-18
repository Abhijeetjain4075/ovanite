import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { SubmissionStatus } from "@/backend";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageMeta } from "@/components/layout/PageMeta";
import { SurfaceCard } from "@/components/shared/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminFaqs } from "@/hooks/useAdminFaqs";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { useAdminSubmissions } from "@/hooks/useAdminSubmissions";
import { useAdminTeam } from "@/hooks/useAdminTeam";
import { useSiteContent } from "@/hooks/useSiteContent";
import { formatDateTime } from "@/lib/format";

const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `admin-dashboard-skeleton-${i}`,
);

const SUBMISSION_KIND_LABELS: Record<string, string> = {
  contact: "Contact",
  waitlist: "Waitlist",
};

function submissionKindLabel(kind: string): string {
  return SUBMISSION_KIND_LABELS[kind] ?? kind;
}

type StatCard = {
  label: string;
  value: string;
  detail: string;
  to: string;
  ocid: string;
};

export default function AdminDashboard() {
  const products = useAdminProducts();
  const faqs = useAdminFaqs();
  const submissions = useAdminSubmissions({});
  const team = useAdminTeam();
  const siteContent = useSiteContent();

  const isLoading =
    products.isLoading ||
    faqs.isLoading ||
    submissions.isLoading ||
    team.isLoading ||
    siteContent.isLoading;

  const productList = products.data ?? [];
  const faqList = faqs.data ?? [];
  const submissionList = submissions.data ?? [];
  const teamList = team.data ?? [];

  const publishedProducts = productList.filter(
    (product) => product.state === "published",
  ).length;
  const publishedFaqs = faqList.filter(
    (faq) => faq.state === "published",
  ).length;
  const unreadSubmissions = submissionList.filter(
    (submission) => submission.status === SubmissionStatus.new_,
  ).length;

  const stats: StatCard[] = [
    {
      label: "Products",
      value: String(productList.length),
      detail: `${publishedProducts} published`,
      to: "/admin/products",
      ocid: "admin.dashboard.products_card",
    },
    {
      label: "FAQs",
      value: String(faqList.length),
      detail: `${publishedFaqs} published`,
      to: "/admin/faqs",
      ocid: "admin.dashboard.faqs_card",
    },
    {
      label: "Submissions",
      value: String(submissionList.length),
      detail: `${unreadSubmissions} unread`,
      to: "/admin/submissions",
      ocid: "admin.dashboard.submissions_card",
    },
    {
      label: "Team",
      value: String(teamList.length),
      detail: "Admins with access",
      to: "/admin/team",
      ocid: "admin.dashboard.team_card",
    },
  ];

  const recent = submissionList.slice(0, 5);

  return (
    <>
      <PageMeta
        title="Admin"
        description="Manage Ovanite products, FAQs, site copy, submissions, and team access."
      />
      <AdminLayout
        title="Dashboard"
        description="An overview of the content, submissions, and access that power the Ovanite site."
      >
        {isLoading ? (
          <div
            data-ocid="admin.dashboard.loading_state"
            className="grid gap-4 sm:grid-cols-2"
          >
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-32 rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat) => (
                <SurfaceCard
                  key={stat.label}
                  interactive
                  data-ocid={stat.ocid}
                  className="p-6"
                >
                  <Link
                    to={stat.to}
                    className="flex items-start justify-between gap-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div>
                      <p className="eyebrow">{stat.label}</p>
                      <p className="mt-3 font-display text-4xl font-bold tracking-tight">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {stat.detail}
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                    />
                  </Link>
                </SurfaceCard>
              ))}
            </div>

            <div className="border border-border bg-card">
              <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
                <h2 className="font-display text-lg font-bold tracking-tight">
                  Recent submissions
                </h2>
                <Link
                  to="/admin/submissions"
                  data-ocid="admin.dashboard.view_submissions_link"
                  className="rounded-sm text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  View all
                </Link>
              </div>

              {recent.length === 0 ? (
                <div
                  data-ocid="admin.dashboard.submissions_empty_state"
                  className="px-6 py-10 text-sm text-muted-foreground"
                >
                  No submissions yet. Contact and waitlist entries will appear
                  here.
                </div>
              ) : (
                <ul data-ocid="admin.dashboard.submissions_list">
                  {recent.map((submission, i) => (
                    <li
                      key={String(submission.id)}
                      data-ocid={`admin.dashboard.submission_item.${i + 1}`}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {submission.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {submission.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {submissionKindLabel(submission.kind)}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatDateTime(submission.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
