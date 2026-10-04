import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowUpRight, Check, Clock3, ExternalLink, FileText, LockKeyhole, Pencil, RefreshCw, ShieldCheck, X } from "lucide-react";
import { Link, useParams } from "wouter";
import { SelectField, submissionCategories, projectStatuses, TextAreaField, TextField } from "@/components/SubmissionFields";
import type { ProjectStatus, SubmissionFormData } from "@/types/portal";
import { EMPTY_SUBMISSION } from "@/types/portal";
import { trpc } from "@/lib/trpc";

const displayStatus = (value: string) => value.replaceAll("_", " ");
const formatDate = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const materialFields = [
  ["repositoryUrl", "Repository"],
  ["liveUrl", "Live product or demo"],
  ["documentationUrl", "Documentation"],
  ["demoVideoUrl", "Demo video"],
] as const;

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const query = trpc.portal.detailMine.useQuery({ id: id ?? "" }, { enabled: Boolean(id), retry: false });
  const update = trpc.portal.updateSubmitted.useMutation();
  const withdraw = trpc.portal.withdraw.useMutation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SubmissionFormData>(EMPTY_SUBMISSION);
  const [updateError, setUpdateError] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    const record = query.data.record;
    setForm({
      participantName: record.participantName || "", participantEmail: record.participantEmail || "", country: record.country || "", profileUrl: record.profileUrl || "",
      projectName: record.projectName || "", shortDescription: record.shortDescription || "", problemSolved: record.problemSolved || "", category: record.category || "",
      repositoryUrl: record.repositoryUrl || "", liveUrl: record.liveUrl || "", documentationUrl: record.documentationUrl || "", demoVideoUrl: record.demoVideoUrl || "",
      technologyStack: record.technologyStack || "", projectStatus: (record.projectStatus || "") as ProjectStatus | "",
    });
  }, [query.data]);

  if (query.isLoading) return <div className="page-wrap"><div className="loading-panel" role="status"><span className="loading-line" />Loading your submission record…</div></div>;
  if (query.error || !query.data) return <div className="page-wrap"><div className="page-intro"><div><p className="eyebrow mono">RECORD / UNAVAILABLE</p><h1>Submission not found.</h1><p className="intro-copy">This record may not exist or may not be available to your account.</p></div></div><Link className="button button-secondary" href="/my-submissions"><ArrowLeft size={15} /> Back to my submissions</Link></div>;

  const { record, acceptedTerms, history, validation, evaluation } = query.data;
  const editable = record.status === "terms_accepted";
  const canWithdraw = ["terms_accepted", "validation", "evaluation", "eligible", "not_eligible"].includes(record.status);
  const setField = (key: keyof SubmissionFormData, value: string) => setForm(current => ({ ...current, [key]: value }));
  async function saveChanges() {
    setUpdateError("");
    if (!form.projectStatus) { setUpdateError("Select a valid project status before saving."); return; }
    try {
      await update.mutateAsync({ id: record.id, data: { ...form, projectStatus: form.projectStatus as ProjectStatus } });
      setEditing(false);
      await utils.portal.detailMine.invalidate({ id: record.id });
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Changes could not be saved.");
    }
  }
  async function confirmWithdrawal() {
    try {
      await withdraw.mutateAsync({ id: record.id, reason: withdrawReason });
      setConfirmingWithdraw(false);
      await Promise.all([utils.portal.detailMine.invalidate({ id: record.id }), utils.portal.mySubmissions.invalidate()]);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Withdrawal could not be recorded.");
    }
  }

  return (
    <div className="page-wrap">
      <div className="detail-backline"><Link className="text-link" href="/my-submissions"><ArrowLeft size={14} /> My submissions</Link><span className="mono record-id">{record.id}</span></div>
      <div className="page-intro detail-intro intro-rule"><div><p className="eyebrow"><span className="marker" /> SUBMISSION RECORD / {record.category || "PROJECT"}</p><h1>{record.projectName || "Untitled draft"}</h1><p className="intro-copy">{record.shortDescription || "Project details have not been added yet."}</p></div><span className={`status-pill status-${record.status}`}>{displayStatus(record.status)}</span></div>
      {updateError && <div className="inline-error request-error" role="alert"><AlertCircle size={15} />{updateError}</div>}
      <div className="record-detail-layout">
        <div className="record-detail-main">
          {editing ? <section className="detail-panel" aria-labelledby="edit-project-heading"><div className="panel-heading"><div><p className="eyebrow mono">EDITABLE BEFORE VALIDATION</p><h2 id="edit-project-heading">Project details</h2></div><button className="icon-button" type="button" onClick={() => setEditing(false)} aria-label="Cancel edit"><X size={16} /></button></div>
            <div className="form-grid two-col">
              <TextField id="projectName" label="Project name" value={form.projectName} onChange={value => setField("projectName", value)} required />
              <SelectField id="category" label="Category" value={form.category} onChange={value => setField("category", value)} options={submissionCategories} placeholder="Select a category" required />
              <TextField id="shortDescription" label="Short description" value={form.shortDescription} onChange={value => setField("shortDescription", value)} required />
              <SelectField id="projectStatus" label="Project status" value={form.projectStatus} onChange={value => setField("projectStatus", value as ProjectStatus | "")} options={projectStatuses} placeholder="Select a project status" required />
              <div className="span-two"><TextAreaField id="problemSolved" label="Problem solved" value={form.problemSolved} onChange={value => setField("problemSolved", value)} required rows={3} /></div>
              <TextField id="repositoryUrl" label="Repository URL" type="url" value={form.repositoryUrl} onChange={value => setField("repositoryUrl", value)} />
              <TextField id="liveUrl" label="Live product or demo URL" type="url" value={form.liveUrl} onChange={value => setField("liveUrl", value)} />
              <TextField id="documentationUrl" label="Documentation URL" type="url" value={form.documentationUrl} onChange={value => setField("documentationUrl", value)} />
              <TextField id="demoVideoUrl" label="Demo video URL" type="url" value={form.demoVideoUrl} onChange={value => setField("demoVideoUrl", value)} />
              <TextAreaField id="technologyStack" label="Technology stack" value={form.technologyStack} onChange={value => setField("technologyStack", value)} required rows={2} />
            </div>
            <div className="wizard-actions"><button className="button button-secondary" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button button-primary" type="button" disabled={update.isPending} onClick={() => void saveChanges()}>{update.isPending ? "Saving…" : "Save changes"}</button></div>
          </section> : <>
            <section className="detail-panel"><div className="panel-heading"><div><p className="eyebrow mono">PROJECT SUMMARY</p><h2>What you built</h2></div>{editable && <button className="button button-secondary button-small" type="button" onClick={() => setEditing(true)}><Pencil size={14} /> Edit details</button>}</div><dl className="detail-description"><dt>Problem solved</dt><dd>{record.problemSolved || "Not provided"}</dd><dt>Project status</dt><dd>{record.projectStatus || "Not provided"}</dd><dt>Technology stack</dt><dd>{record.technologyStack || "Not provided"}</dd></dl></section>
            <section className="detail-panel"><div className="panel-heading"><div><p className="eyebrow mono">SUBMITTED MATERIALS</p><h2>Evidence</h2></div><span className="mono panel-count">{materialFields.filter(([key]) => Boolean(record[key])).length} LINKS</span></div><div className="evidence-list">{materialFields.map(([key, label]) => { const value = record[key]; return value ? <a key={key} href={value} target="_blank" rel="noopener noreferrer" className="evidence-link"><span><ExternalLink size={15} /></span><span><strong>{label}</strong><small>{value}</small></span><ArrowUpRight size={15} /></a> : null; })}{!materialFields.some(([key]) => Boolean(record[key])) && <p className="empty-inline">No evidence links were recorded.</p>}</div></section>
            <section className="detail-panel"><div className="panel-heading"><div><p className="eyebrow mono">REVIEW PROGRESS</p><h2>Validation & evaluation</h2></div><span className={`status-pill status-${record.status}`}>{displayStatus(record.status)}</span></div><div className="progress-track" aria-label={`Current status: ${displayStatus(record.status)}`}>{["terms_accepted", "validation", "evaluation", "eligible", "selected"].map((status, index) => { const order = ["draft", "submitted", "terms_accepted", "validation", "evaluation", "eligible", "selected", "rejected", "withdrawn", "archived"]; const current = order.indexOf(record.status); const done = order.indexOf(status) <= current && !["rejected", "withdrawn"].includes(record.status); return <div key={status} className={`progress-step ${done ? "is-done" : ""} ${record.status === status ? "is-current" : ""}`}><span>{done ? <Check size={12} /> : `0${index + 1}`}</span><small>{displayStatus(status)}</small></div>; })}</div><div className="review-facts"><div><span>Validation</span><strong>{validation ? validation.outcome === "pass" ? "Completed · passed" : "Completed · follow-up" : record.status === "validation" ? "In progress" : "Not started"}</strong></div><div><span>Evaluation</span><strong>{evaluation ? evaluation.available ? "Result available" : "In progress" : record.status === "evaluation" ? "In progress" : "Not started"}</strong></div></div><p className="section-copy compact-copy">Criterion-level evaluator notes are maintained in the Ovanite review workspace. A score or status is not a guarantee of selection.</p></section>
          </>}
        </div>
        <aside className="record-detail-aside">
          <section className="detail-side-panel"><p className="eyebrow mono">RECORD FACTS</p><div className="fact-line"><span>Submission ID</span><strong className="mono">{record.id.slice(0, 8).toUpperCase()}</strong></div><div className="fact-line"><span>Submitted</span><strong>{formatDate(record.submittedAt)}</strong></div><div className="fact-line"><span>Last updated</span><strong>{formatDate(record.updatedAt)}</strong></div><div className="fact-line"><span>Category</span><strong>{record.category || "—"}</strong></div><div className="fact-line"><span>Participant</span><strong>{record.participantName || "—"}</strong></div>{record.profileUrl && <a className="text-link profile-link" href={record.profileUrl} target="_blank" rel="noopener noreferrer">Profile / portfolio <ExternalLink size={13} /></a>}</section>
          <section className="detail-side-panel"><p className="eyebrow mono">ACCEPTANCE RECORD</p><div className="fact-line"><span>Terms version</span><strong className="mono">{record.termsVersion || "—"}</strong></div><div className="fact-line"><span>Accepted at</span><strong>{formatDate(record.termsAcceptedAt)}</strong></div><div className="acceptance-lock"><LockKeyhole size={14} /><span>Accepted version is retained with this record.</span></div>{record.declarations && <div className="declarations-summary">{Object.entries(record.declarations).map(([key, value]) => <div key={key}><Check size={13} /><span>{key.replaceAll(/([A-Z])/g, " $1").replace(/^./, letter => letter.toUpperCase())}</span>{value && <span className="mono">YES</span>}</div>)}</div>}{acceptedTerms && <details className="accepted-terms"><summary><FileText size={14} /> View accepted terms text</summary><div><h3>{acceptedTerms.title}</h3><p className="mono">VERSION {acceptedTerms.version}</p><pre>{acceptedTerms.content}</pre></div></details>}</section>
          {canWithdraw && <section className="withdraw-panel"><p className="eyebrow mono">PARTICIPANT ACTION</p><h3>Withdraw this submission?</h3><p>You can withdraw while review is active. The status will change, but the dated record and acceptance history will remain for audit purposes.</p>{!confirmingWithdraw ? <button className="button button-secondary" type="button" onClick={() => setConfirmingWithdraw(true)}>Review withdrawal</button> : <div className="withdraw-confirm"><label htmlFor="withdraw-reason">Optional reason</label><textarea id="withdraw-reason" value={withdrawReason} onChange={event => setWithdrawReason(event.target.value)} maxLength={1000} rows={2} placeholder="Add a note for the review team" /><div className="withdraw-actions"><button className="button button-secondary" type="button" onClick={() => setConfirmingWithdraw(false)}>Keep submission</button><button className="button button-danger" type="button" disabled={withdraw.isPending} onClick={() => void confirmWithdrawal()}>{withdraw.isPending ? "Recording…" : "Confirm withdrawal"}</button></div></div>}</section>}
        </aside>
      </div>
      <section className="history-section"><div className="panel-heading"><div><p className="eyebrow mono">APPEND-ONLY RECORD</p><h2>Status history</h2></div><Clock3 size={17} /></div>{history.length ? <ol className="history-list">{[...history].reverse().map((event, index) => <li key={`${event.eventType}-${index}`}><span className="history-dot" /><span><strong>{event.toStatus ? `${displayStatus(event.fromStatus || "created")} → ${displayStatus(event.toStatus)}` : event.eventType.replaceAll("_", " ")}</strong><small>{event.eventType.replaceAll("_", " ")} · {formatDate(event.createdAt)}</small></span></li>)}</ol> : <p className="empty-inline">History will appear here as the record changes.</p>}</section>
      <div className="detail-bottom"><Link className="text-link" href="/my-submissions"><ArrowLeft size={14} /> Back to all submissions</Link><span><ShieldCheck size={14} /> Visible only to you and authorized Ovanite reviewers</span></div>
    </div>
  );
}
