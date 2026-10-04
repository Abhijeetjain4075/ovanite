import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Plus, RefreshCw, Save, Scale, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type Criterion = { id: string; label: string; description: string; weight: number };
const dateLabel = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "—";

export default function EvaluationsPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const queue = trpc.portal.admin.evaluationQueue.useQuery();
  const rubrics = trpc.portal.admin.rubricVersions.useQuery();
  const createDraft = trpc.portal.admin.createRubricDraft.useMutation();
  const updateDraft = trpc.portal.admin.updateRubricDraft.useMutation();
  const publish = trpc.portal.admin.publishRubric.useMutation();
  const isOwner = user?.portalRole === "owner";
  const [version, setVersion] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isExistingDraft, setIsExistingDraft] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!rubrics.data || criteria.length) return;
    const draft = rubrics.data.versions.find(item => item.status === "draft");
    if (draft) { setVersion(draft.version); setCriteria(draft.criteria); setIsExistingDraft(true); }
  }, [rubrics.data, criteria.length]);

  function startNewDraft() {
    if (!rubrics.data) return;
    const next = rubrics.data.versions.length + 1;
    setVersion(`rubric-${next}.0`);
    setCriteria(rubrics.data.defaultCriteria);
    setIsExistingDraft(false);
    setEditing(true); setNotice(""); setError("");
  }
  function editDraft(item: { version: string; criteria: Criterion[] }) {
    setVersion(item.version); setCriteria(item.criteria); setIsExistingDraft(true); setEditing(true); setNotice(""); setError("");
  }
  function updateCriterion(index: number, key: keyof Criterion, value: string | number) {
    setCriteria(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }
  const weightsTotal = criteria.reduce((total, item) => total + Number(item.weight || 0), 0);

  async function saveRubric() {
    setError(""); setNotice("");
    try {
      if (isExistingDraft) await updateDraft.mutateAsync({ version, criteria });
      else await createDraft.mutateAsync({ version, criteria });
      setIsExistingDraft(true); setNotice(`Draft ${version} saved.`);
      await utils.portal.admin.rubricVersions.invalidate();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The rubric draft could not be saved."); }
  }
  async function publishRubric() {
    setError(""); setNotice("");
    if (!isExistingDraft || weightsTotal !== 100) { setError("Save a draft with weights totaling 100% before publishing."); return; }
    if (!window.confirm(`Publish rubric ${version}? It will be used for future evaluations. Existing evaluations keep their recorded rubric version.`)) return;
    try {
      await publish.mutateAsync({ version }); setNotice(`Rubric ${version} is published for future evaluations.`); setEditing(false);
      await Promise.all([utils.portal.admin.rubricVersions.invalidate(), utils.portal.admin.evaluationQueue.invalidate()]);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The rubric could not be published."); }
  }

  return (
    <div className="page-wrap">
      <div className="page-intro intro-rule"><div><p className="eyebrow"><span className="marker" /> OVANITE REVIEW / EVALUATION</p><h1>Evaluation workspace</h1><p className="intro-copy">A configurable rubric guides evidence-led review. Scores inform a recorded decision; they do not guarantee selection.</p></div><span className="queue-total mono">{queue.data?.items.length ?? "—"} IN EVALUATION</span></div>
      {notice && <div className="success-banner" role="status"><CheckCircle2 size={16} />{notice}</div>}{error && <div className="inline-error request-error" role="alert">{error}</div>}
      <div className="evaluation-workspace">
        <section className="evaluation-queue"><div className="section-heading-row"><div><p className="eyebrow mono">ACTIVE QUEUE</p><h2>Ready for evaluation</h2></div><button className="icon-button" type="button" onClick={() => { void queue.refetch(); void rubrics.refetch(); }} aria-label="Refresh evaluation data"><RefreshCw size={15} /></button></div>
          {queue.isLoading ? <div className="loading-panel" role="status"><span className="loading-line" />Loading the queue…</div> : queue.error ? <div className="state-panel state-error" role="alert"><strong>Evaluation queue unavailable.</strong><p>Try again; no review data has been changed.</p><button className="button button-secondary" type="button" onClick={() => void queue.refetch()}>Retry</button></div> : queue.data?.items.length ? <div className="evaluation-list">{queue.data.items.map(item => <Link className="evaluation-item" href={`/admin/submissions/${item.id}`} key={item.id}><span className="evaluation-index mono">{item.id.slice(0, 6).toUpperCase()}</span><span className="evaluation-item-main"><strong>{item.projectName || "Untitled project"}</strong><small>{item.participantName || "Participant"} · {item.category || "Uncategorized"}</small></span><span className="status-pill status-evaluation">In evaluation</span><ArrowRight size={15} /></Link>)}</div> : <div className="empty-state compact-empty"><p className="eyebrow mono">NO ACTIVE ITEMS</p><h3>The queue is clear.</h3><p>Submissions with a passing validation result will appear here when moved into evaluation.</p></div>}
          <p className="section-copy compact-copy">Open a submission record to complete criterion-level scoring and notes.</p>
        </section>
        <section className="rubric-workspace"><div className="section-heading-row"><div><p className="eyebrow mono">CONFIGURABLE RUBRIC</p><h2>Criteria & weights</h2></div>{isOwner && !editing && <button className="button button-secondary button-small" type="button" onClick={startNewDraft}><Plus size={14} /> New version</button>}</div>
          {rubrics.isLoading ? <div className="loading-panel" role="status"><span className="loading-line" />Loading rubric versions…</div> : rubrics.error ? <div className="state-panel state-error" role="alert"><strong>Rubric versions could not be loaded.</strong><button className="button button-secondary" type="button" onClick={() => void rubrics.refetch()}>Retry</button></div> : <>
            <div className="rubric-version-strip">{rubrics.data?.versions.length ? rubrics.data.versions.map(item => <div className="rubric-version-row" key={item.version}><span className={`version-state ${item.status}`}>{item.status}</span><strong className="mono">{item.version}</strong><span>{item.criteria.length} criteria · {dateLabel(item.publishedAt || item.createdAt)}</span>{isOwner && item.status === "draft" && <button className="text-link" type="button" onClick={() => editDraft(item)}>Edit draft</button>}</div>) : <div className="rubric-empty-note"><Scale size={16} /><span>No rubric version is published yet. The baseline below is a configurable starting point.</span></div>}</div>
            {editing ? <div className="rubric-editor"><div className="form-grid two-col"><div className="form-field"><label htmlFor="rubric-version">Version identifier</label><input id="rubric-version" value={version} onChange={event => setVersion(event.target.value)} disabled={isExistingDraft} /></div><div className={`weight-total ${weightsTotal === 100 ? "valid" : "invalid"}`}>WEIGHTS TOTAL <strong>{weightsTotal}%</strong></div></div>{criteria.map((criterion, index) => <div className="criterion-edit-row" key={criterion.id}><span className="criterion-num mono">{String(index + 1).padStart(2, "0")}</span><div className="criterion-edit-fields"><label><span>Criterion</span><input value={criterion.label} onChange={event => updateCriterion(index, "label", event.target.value)} /></label><label><span>Definition</span><input value={criterion.description} onChange={event => updateCriterion(index, "description", event.target.value)} /></label></div><label className="weight-input"><span>Weight %</span><input type="number" min={1} max={100} value={criterion.weight} onChange={event => updateCriterion(index, "weight", Number(event.target.value))} /></label></div>)}<p className="field-hint">Published rubric versions are immutable. A new version affects future evaluations only.</p><div className="wizard-actions"><button className="button button-secondary" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button button-secondary" type="button" disabled={!isOwner || createDraft.isPending || updateDraft.isPending} onClick={() => void saveRubric()}><Save size={14} /> Save draft</button><button className="button button-primary" type="button" disabled={!isOwner || publish.isPending || weightsTotal !== 100} onClick={() => void publishRubric()}>Publish version</button></div></div> : <div className="rubric-readonly-list">{(rubrics.data?.versions.find(item => item.status === "published")?.criteria ?? rubrics.data?.defaultCriteria ?? []).map((criterion, index) => <div className="rubric-readonly-row" key={criterion.id}><span className="mono">{String(index + 1).padStart(2, "0")}</span><div><strong>{criterion.label}</strong><small>{criterion.description}</small></div><b>{criterion.weight}%</b></div>)}</div>}
            {!editing && !rubrics.data?.versions.some(item => item.status === "published") && <div className="publish-needed-note"><ShieldCheck size={15} /><span>Score submission records only after an owner publishes a rubric version. Default dimensions are a draft starting point, not a decision.</span></div>}
            {!isOwner && <p className="readonly-note"><LockKeyhole size={14} /> Only the owner can create, edit, or publish rubric versions. Reviewers may score records against a published rubric.</p>}
          </>}
        </section>
      </div>
    </div>
  );
}
