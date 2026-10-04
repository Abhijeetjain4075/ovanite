import { ArrowRight, Clock3, FilePlus2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function labelStatus(status: string) {
  return status.replaceAll("_", " ");
}
function dateLabel(value: Date | string | null) {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function PortalHome() {
  const submissions = trpc.portal.mySubmissions.useQuery();
  return (
    <div className="page-wrap">
      <div className="page-intro intro-rule">
        <div>
          <p className="eyebrow"><span className="marker" /> BUILDER WORKSPACE / 01</p>
          <h1>Build something that matters.</h1>
          <p className="intro-copy">Share the software you’ve built. Keep every review step, update, and decision in one clear record.</p>
        </div>
        <Link className="button button-primary intro-cta" href="/submit">Start a submission <ArrowRight size={16} /></Link>
      </div>

      <div className="home-layout">
        <section className="home-primary" aria-labelledby="submissions-heading">
          <div className="section-heading-row">
            <div><p className="eyebrow mono">YOUR RECORDS</p><h2 id="submissions-heading">My submissions</h2></div>
            {submissions.data && submissions.data.length > 0 && <Link className="text-link" href="/my-submissions">View all <ArrowRight size={14} /></Link>}
          </div>
          {submissions.isLoading ? <div className="loading-panel" role="status"><span className="loading-line" />Loading your private records…</div> : submissions.error ? <div className="state-panel state-error" role="alert"><strong>We couldn’t load your submissions.</strong><p>Your records haven’t been changed. Try again in a moment.</p><button className="button button-secondary" onClick={() => void submissions.refetch()}>Retry</button></div> : submissions.data?.length ? (
            <div className="submission-list">
              {submissions.data.slice(0, 4).map(item => (
                <Link href={`/submission/${item.id}`} key={item.id} className="submission-row">
                  <span className="submission-row-mark" aria-hidden="true">↗</span>
                  <span className="submission-row-main"><strong>{item.projectName || "Untitled draft"}</strong><span className="submission-meta">{item.category || "Draft"} <span>·</span> Updated {dateLabel(item.updatedAt)}</span></span>
                  <span className={`status-pill status-${item.status}`}>{labelStatus(item.status)}</span>
                  <ArrowRight className="row-arrow" size={16} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-index mono">01</div><h3>Your work starts here.</h3>
              <p>There are no submissions in your workspace yet. Start with the problem, then share the evidence that makes your work real.</p>
              <Link className="button button-primary" href="/submit">Create a submission <ArrowRight size={16} /></Link>
            </div>
          )}
        </section>
        <aside className="home-aside">
          <div className="aside-note"><span className="aside-icon"><ShieldCheck size={18} /></span><p className="eyebrow mono">PRIVATE BY DESIGN</p><h3>Your work stays yours.</h3><p>Only you and authorized Ovanite reviewers can access your submission materials.</p></div>
          <div className="aside-note"><span className="aside-icon"><Clock3 size={18} /></span><p className="eyebrow mono">A CLEAR PROCESS</p><h3>Every step is recorded.</h3><p>Terms acceptance, validation, evaluation, and decisions remain attached to a dated record.</p></div>
          <Link className="aside-link" href="/my-submissions"><FilePlus2 size={16} /> Submission history <ArrowRight size={14} /></Link>
        </aside>
      </div>
      <div className="bottom-note"><span className="mono">OVANITE / PROGRAM</span><span>No submission guarantees selection or another outcome.</span></div>
    </div>
  );
}
