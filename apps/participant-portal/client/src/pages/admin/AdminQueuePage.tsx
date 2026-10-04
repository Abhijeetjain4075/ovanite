import { useState } from "react";
import { ArrowRight, Filter, RefreshCw, Search } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const statuses = ["submitted", "terms_accepted", "validation", "evaluation", "eligible", "not_eligible", "selected", "rejected", "withdrawn", "archived"] as const;
type QueueStatus = (typeof statuses)[number];
type QueueFilters = { page: number; pageSize: number; q: string; status?: QueueStatus; category?: string; from?: string; to?: string };
const dateLabel = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "—";
const statusLabel = (value: string) => value.replaceAll("_", " ");

export default function AdminQueuePage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<QueueStatus | "">("");
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filters, setFilters] = useState<QueueFilters>({ page: 1, pageSize: 25, q: "" });
  const query = trpc.portal.admin.queue.useQuery(filters);
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / filters.pageSize));
  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    setFilters({ page: 1, pageSize: 25, q: q.trim(), status: status || undefined, category: category || undefined, from: from || undefined, to: to || undefined });
  }
  return (
    <div className="page-wrap">
      <div className="page-intro intro-rule"><div><p className="eyebrow"><span className="marker" /> OVANITE REVIEW / INTAKE</p><h1>Submission queue</h1><p className="intro-copy">A private working queue for submitted projects. Drafts and participant-only records are not exposed here.</p></div><span className="queue-total mono">{query.data ? `${query.data.total.toString().padStart(2, "0")} RECORDS` : "LOADING"}</span></div>
      <form className="filter-bar" onSubmit={applyFilters} aria-label="Filter submissions">
        <div className="filter-search"><Search size={16} /><label className="sr-only" htmlFor="queue-search">Search participant or project</label><input id="queue-search" value={q} onChange={event => setQ(event.target.value)} placeholder="Search participant, project, or email" /></div>
        <label className="sr-only" htmlFor="queue-status">Lifecycle status</label><select id="queue-status" value={status} onChange={event => setStatus(event.target.value as QueueStatus | "")}><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select>
        <label className="sr-only" htmlFor="queue-category">Project category</label><select id="queue-category" value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{(query.data?.categories ?? []).map(value => <option key={value} value={value}>{value}</option>)}</select>
        <label className="sr-only" htmlFor="queue-from">From date</label><input id="queue-from" type="date" value={from} onChange={event => setFrom(event.target.value)} aria-label="From date" />
        <label className="sr-only" htmlFor="queue-to">To date</label><input id="queue-to" type="date" value={to} onChange={event => setTo(event.target.value)} aria-label="To date" />
        <button className="button button-primary button-small" type="submit"><Filter size={14} /> Apply</button>
      </form>
      {query.isLoading ? <div className="loading-panel" role="status"><span className="loading-line" />Loading the review queue…</div> : query.error ? <div className="state-panel state-error" role="alert"><strong>The queue could not be loaded.</strong><p>No records have been changed.</p><button className="button button-secondary" type="button" onClick={() => void query.refetch()}><RefreshCw size={14} /> Try again</button></div> : query.data?.items.length ? <>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Project</th><th scope="col">Participant</th><th scope="col">Status</th><th scope="col">Category</th><th scope="col">Submitted</th><th scope="col">Record</th></tr></thead><tbody>{query.data.items.map(record => <tr key={record.id}><td><Link className="table-project-link" href={`/admin/submissions/${record.id}`}><strong>{record.projectName || "Untitled project"}</strong><small>{record.shortDescription || "No short description"}</small></Link></td><td><span className="table-person">{record.participantName || "Participant"}</span><small className="table-secondary">{record.participantEmail || "—"}</small></td><td><span className={`status-pill status-${record.status}`}>{statusLabel(record.status)}</span></td><td>{record.category || "—"}</td><td>{dateLabel(record.submittedAt)}</td><td><Link className="icon-link" href={`/admin/submissions/${record.id}`} aria-label={`Open review for ${record.projectName || "submission"}`}><ArrowRight size={16} /></Link></td></tr>)}</tbody></table></div>
        <div className="table-pagination"><span className="mono">PAGE {filters.page} / {totalPages} <span>·</span> {query.data.total} RECORDS</span><div><button className="button button-secondary button-small" type="button" disabled={filters.page <= 1} onClick={() => setFilters(current => ({ ...current, page: current.page - 1 }))}>Previous</button><button className="button button-secondary button-small" type="button" disabled={filters.page >= totalPages} onClick={() => setFilters(current => ({ ...current, page: current.page + 1 }))}>Next</button></div></div>
      </> : <div className="empty-state queue-empty"><span className="empty-index mono">NO MATCHES</span><h2>No submissions match this view.</h2><p>Submitted records will appear here with their lifecycle state and review context. Try another filter.</p><button className="button button-secondary" type="button" onClick={() => { setQ(""); setStatus(""); setCategory(""); setFrom(""); setTo(""); setFilters({ page: 1, pageSize: 25, q: "" }); }}><RefreshCw size={14} /> Clear filters</button></div>}
    </div>
  );
}
