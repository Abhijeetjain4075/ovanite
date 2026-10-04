import { ArrowRight, FilePlus2, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const formatDate = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const statusText = (value: string) => value.replaceAll("_", " ");
function nextAction(status: string) {
  if (status === "draft") return "Continue your draft";
  if (status === "terms_accepted" || status === "submitted") return "Your submission is queued for validation";
  if (status === "validation") return "Validation is in progress";
  if (status === "evaluation") return "Evaluation is in progress";
  if (status === "eligible") return "Eligible · selection decision pending";
  if (status === "not_eligible") return "Not eligible · decision recorded";
  if (status === "selected") return "Selection decision recorded";
  if (status === "rejected") return "Decision recorded";
  if (status === "withdrawn") return "Withdrawn · record retained";
  return "Archived record · view details";
}

export default function MySubmissionsPage() {
  const query = trpc.portal.mySubmissions.useQuery();
  return (
    <div className="page-wrap">
      <div className="page-intro intro-rule"><div><p className="eyebrow"><span className="marker" /> PARTICIPANT RECORDS / 02</p><h1>My submissions</h1><p className="intro-copy">A private, dated record of each project you’ve sent to Ovanite.</p></div><Link className="button button-primary intro-cta" href="/submit">New submission <FilePlus2 size={15} /></Link></div>
      {query.isLoading ? <div className="loading-panel" role="status"><span className="loading-line" />Loading your private records…</div> : query.error ? <div className="state-panel state-error" role="alert"><strong>We couldn’t load this list.</strong><p>Your submission data has not been changed.</p><button className="button button-secondary" type="button" onClick={() => void query.refetch()}><RefreshCw size={14} /> Try again</button></div> : query.data?.length ? <section className="records-section" aria-label="Submission records">
        <div className="records-heading mono"><span>PROJECT / CATEGORY</span><span>STATUS</span><span>SUBMITTED</span><span>TERMS VERSION</span><span>NEXT ACTION</span><span /></div>
        <div className="records-list">{query.data.map(record => <Link href={`/submission/${record.id}`} className="record-grid-row" key={record.id}>
          <span className="record-project"><strong>{record.projectName || "Untitled draft"}</strong><small>{record.category || "Draft project"}</small></span>
          <span className={`status-pill status-${record.status}`}>{statusText(record.status)}</span>
          <span className="record-date">{formatDate(record.submittedAt)}</span>
          <span className="record-version mono">{record.termsVersion || "Not accepted"}</span>
          <span className="record-next">{nextAction(record.status)}</span>
          <ArrowRight className="row-arrow" size={16} />
        </Link>)}</div>
        <p className="records-footnote">Showing {query.data.length} {query.data.length === 1 ? "record" : "records"}. Participant data is never visible on public pages.</p>
      </section> : <div className="empty-state records-empty"><span className="empty-index mono">NO RECORDS</span><p className="eyebrow mono">YOUR WORKSPACE</p><h2>No projects submitted yet.</h2><p>When you submit a project, its status, accepted terms version, and next action will appear here.</p><Link className="button button-primary" href="/submit">Start a submission <ArrowRight size={15} /></Link></div>}
    </div>
  );
}
