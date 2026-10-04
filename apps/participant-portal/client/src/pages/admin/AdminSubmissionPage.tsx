import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, Circle, Clock3, ExternalLink, FileText, LockKeyhole, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const dateLabel = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const statusLabel = (value: string) => value.replaceAll("_", " ");
const validationChecks = [
  { id: "evidence_links_reviewed", label: "Evidence links reviewed" },
  { id: "problem_scope_reviewed", label: "Problem and scope are clear" },
  { id: "rights_declaration_reviewed", label: "Rights declarations are recorded" },
  { id: "duplicate_check_completed", label: "Duplicate check completed" },
  { id: "terms_version_current", label: "Accepted terms version is present" },
];
const materialFields = [
  ["repositoryUrl", "Repository"], ["liveUrl", "Live demo"], ["documentationUrl", "Documentation"], ["demoVideoUrl", "Demo video"],
] as const;

export default function AdminSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.portal.admin.detail.useQuery({ id: id ?? "" }, { enabled: Boolean(id), retry: false });
  const rubricQuery = trpc.portal.admin.rubricVersions.useQuery();
  const validationMutation = trpc.portal.admin.saveValidation.useMutation();
  const advanceMutation = trpc.portal.admin.advance.useMutation();
  const evaluationMutation = trpc.portal.admin.saveEvaluation.useMutation();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [validationNotes, setValidationNotes] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [criterionNotes, setCriterionNotes] = useState<Record<string, string>>({});
  const [evaluationNotes, setEvaluationNotes] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const latestValidationCandidate = query.data?.validations[0]?.result;
  useEffect(() => {
    if (!latestValidationCandidate) return;
    setChecks(latestValidationCandidate.checks);
    setValidationNotes(latestValidationCandidate.notes ?? "");
  }, [latestValidationCandidate?.id]);
  const role = user?.portalRole ?? "participant";
  const canReview = role === "owner" || role === "editor";
  const isOwner = role === "owner";

  async function refresh() {
    await Promise.all([
      utils.portal.admin.detail.invalidate({ id: id ?? "" }),
      utils.portal.admin.queue.invalidate(),
      utils.portal.admin.evaluationQueue.invalidate(),
    ]);
  }
  async function advance(to: "validation" | "evaluation" | "eligible" | "not_eligible" | "selected" | "rejected" | "archived") {
    setError(""); setMessage("");
    if (to === "archived" && !window.confirm("Archive this record? It will remain available in the audit trail but leave the active review workflow.")) return;
    try {
      await advanceMutation.mutateAsync({ id: id ?? "", to, note: decisionNote || undefined });
      setMessage(`Status recorded: ${statusLabel(to)}.`);
      setDecisionNote("");
      await refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The status change could not be recorded."); }
  }
  async function saveValidation() {
    setError(""); setMessage("");
    try {
      const result = await validationMutation.mutateAsync({ id: id ?? "", checks, notes: validationNotes || undefined });
      setMessage(`Validation recorded: ${result.outcome}.`);
      await refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Validation could not be saved."); }
  }
  async function saveEvaluation() {
    setError(""); setMessage("");
    try {
      const result = await evaluationMutation.mutateAsync({ id: id ?? "", scores, criterionNotes, notes: evaluationNotes || undefined });
      setMessage(`Evaluation saved · weighted score ${result.overallScore}/5 using rubric ${result.rubricVersion}.`);
      setScores({}); setCriterionNotes({}); setEvaluationNotes("");
      await refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The evaluation could not be saved."); }
  }

  if (query.isLoading) return <div className="page-wrap"><div className="loading-panel" role="status"><span className="loading-line" />Loading the review record…</div></div>;
  if (query.error || !query.data) return <div className="page-wrap"><div className="page-intro"><div><p className="eyebrow mono">OVANITE REVIEW / UNAVAILABLE</p><h1>Record not found.</h1><p className="intro-copy">This record could not be loaded in the review workspace.</p></div></div><button className="button button-secondary" type="button" onClick={() => navigate("/admin/submissions")}><ArrowLeft size={14} /> Back to queue</button></div>;

  const { submission, acceptedTerms, validations, evaluations, decisions, events } = query.data;
  const publishedRubric = rubricQuery.data?.versions.find(rubric => rubric.status === "published");
  const latestValidation = validations[0]?.result;
  const isEvaluating = submission.status === "evaluation";
  const evaluated = evaluations.length > 0;
  const scoresComplete = Boolean(publishedRubric?.criteria.length) && publishedRubric!.criteria.every(criterion => scores[criterion.id] !== undefined);
  const weightedPreview = publishedRubric && scoresComplete ? Math.round(publishedRubric.criteria.reduce((sum, criterion) => sum + (scores[criterion.id] ?? 0) * criterion.weight, 0) / 100) : null;
  const activeActions = submission.status === "terms_accepted" || submission.status === "validation" || submission.status === "evaluation" || submission.status === "eligible" || submission.status === "not_eligible";

  return (
    <div className="page-wrap">
      <div className="detail-backline"><button className="text-link back-button" type="button" onClick={() => navigate("/admin/submissions")}><ArrowLeft size={14} /> Submission queue</button><span className="mono record-id">{submission.id}</span></div>
      <div className="page-intro detail-intro intro-rule"><div><p className="eyebrow"><span className="marker" /> REVIEW WORKSPACE / {submission.category || "PROJECT"}</p><h1>{submission.projectName || "Untitled project"}</h1><p className="intro-copy">{submission.shortDescription || "No short description was provided."}</p></div><span className={`status-pill status-${submission.status}`}>{statusLabel(submission.status)}</span></div>
      {message && <div className="success-banner" role="status"><CheckCircle2 size={16} />{message}</div>}{error && <div className="inline-error request-error" role="alert">{error}</div>}
      <div className="admin-review-grid">
        <div className="review-primary">
          <section className="detail-panel"><div className="panel-heading"><div><p className="eyebrow mono">PROJECT EVIDENCE</p><h2>Submission materials</h2></div><span className="mono panel-count">{materialFields.filter(([key]) => Boolean(submission[key])).length} LINKS</span></div><p className="review-problem"><span className="mono">PROBLEM</span>{submission.problemSolved || "Not provided"}</p><div className="evidence-list">{materialFields.map(([key, label]) => { const value = submission[key]; return value ? <a key={key} className="evidence-link" href={value} target="_blank" rel="noopener noreferrer"><span><ExternalLink size={15} /></span><span><strong>{label}</strong><small>{value}</small></span><ArrowUpRight size={15} /></a> : null; })}</div><div className="review-meta-grid"><div><span>Technology stack</span><strong>{submission.technologyStack || "—"}</strong></div><div><span>Project status</span><strong>{submission.projectStatus || "—"}</strong></div></div></section>

          <section className="detail-panel"><div className="panel-heading"><div><p className="eyebrow mono">PARTICIPANT DECLARATIONS</p><h2>Acceptance record</h2></div><LockKeyhole size={16} /></div><div className="review-meta-grid"><div><span>Terms version</span><strong className="mono">{submission.termsVersion || "—"}</strong></div><div><span>Accepted at</span><strong>{dateLabel(submission.termsAcceptedAt)}</strong></div><div><span>Submission received</span><strong>{dateLabel(submission.submittedAt)}</strong></div><div><span>Authenticated participant</span><strong>{query.data.userName || submission.participantName || "—"}</strong></div></div><div className="staff-declarations">{Object.entries(submission.declarations ?? {}).map(([key, accepted]) => <div key={key}><span className={accepted ? "check-dot checked" : "check-dot"}>{accepted ? <Check size={11} /> : <Circle size={11} />}</span><span>{key.replaceAll(/([A-Z])/g, " $1").replace(/^./, letter => letter.toUpperCase())}</span><strong>{accepted ? "Accepted" : "Not accepted"}</strong></div>)}</div>{acceptedTerms && <details className="accepted-terms"><summary><FileText size={14} /> View immutable accepted terms · {acceptedTerms.version}</summary><div><h3>{acceptedTerms.title}</h3><pre>{acceptedTerms.content}</pre></div></details>}</section>

          {submission.status === "validation" && <section className="detail-panel workflow-panel"><div className="panel-heading"><div><p className="eyebrow mono">01 / VALIDATION</p><h2>Record validation checks</h2></div><span className="status-pill status-validation">Manual review</span></div><p className="section-copy">These checks are recorded by a reviewer. The portal does not fetch participant URLs or execute submitted code.</p><div className="validation-checks">{validationChecks.map(item => <label key={item.id} className="check-row"><input type="checkbox" checked={Boolean(checks[item.id])} onChange={event => setChecks(current => ({ ...current, [item.id]: event.target.checked }))} disabled={!canReview} /><span>{item.label}</span></label>)}</div><label className="field-label" htmlFor="validation-notes">Validation notes</label><textarea id="validation-notes" value={validationNotes} onChange={event => setValidationNotes(event.target.value)} rows={3} maxLength={5000} placeholder="Document the outcome or follow-up needed" disabled={!canReview} /><div className="wizard-actions"><span>{latestValidation && `Latest result: ${latestValidation.outcome} · ${dateLabel(latestValidation.createdAt)}`}</span><button className="button button-primary" type="button" onClick={() => void saveValidation()} disabled={!canReview || validationMutation.isPending}>{validationMutation.isPending ? "Saving…" : "Record validation"}<Save size={14} /></button></div>{latestValidation && <div className={`validation-result ${latestValidation.outcome}`}><strong>Latest validation: {latestValidation.outcome}</strong><span>To move forward, the most recent validation must pass.</span></div>}</section>}

          {isEvaluating && <section className="detail-panel workflow-panel"><div className="panel-heading"><div><p className="eyebrow mono">02 / STRUCTURED EVALUATION</p><h2>Evaluate against the rubric</h2></div><span className="status-pill status-evaluation">In evaluation</span></div>{publishedRubric ? <><p className="section-copy">Use the published rubric version <span className="mono">{publishedRubric.version}</span>. Score each dimension from 0–5 and note evidence where useful.</p><div className="rubric-score-list">{publishedRubric.criteria.map(criterion => <div className="rubric-score-row" key={criterion.id}><div className="rubric-criterion-copy"><span className="mono weight-label">{criterion.weight}%</span><strong>{criterion.label}</strong><p>{criterion.description}</p></div><label className="score-select-label"><span>Score</span><select aria-label={`${criterion.label} score`} value={scores[criterion.id] ?? ""} onChange={event => setScores(current => ({ ...current, [criterion.id]: Number(event.target.value) }))} disabled={!canReview}><option value="">—</option>{[0, 1, 2, 3, 4, 5].map(score => <option key={score} value={score}>{score} / 5</option>)}</select></label><label className="criterion-note"><span className="sr-only">Notes for {criterion.label}</span><input value={criterionNotes[criterion.id] ?? ""} onChange={event => setCriterionNotes(current => ({ ...current, [criterion.id]: event.target.value }))} placeholder="Evidence note (optional)" maxLength={2000} disabled={!canReview} /></label></div>)}</div><label className="field-label" htmlFor="evaluation-notes">Overall evaluator notes</label><textarea id="evaluation-notes" value={evaluationNotes} onChange={event => setEvaluationNotes(event.target.value)} rows={3} maxLength={5000} placeholder="Summarize the evidence and trade-offs" disabled={!canReview} /><div className="wizard-actions"><span className="weighted-preview">{weightedPreview !== null ? `Weighted result · ${weightedPreview} / 5` : "Score all criteria to calculate the weighted result"}</span><button className="button button-primary" type="button" onClick={() => void saveEvaluation()} disabled={!canReview || !scoresComplete || evaluationMutation.isPending}>{evaluationMutation.isPending ? "Saving…" : "Save evaluation"}<Save size={14} /></button></div></> : <div className="terms-unavailable"><Circle size={17} /><div><strong>No published rubric is available.</strong><p>An owner must publish a rubric before reviewers can score a submission.</p><button className="text-link" type="button" onClick={() => navigate("/admin/evaluations")}>Open rubric workspace <ArrowUpRight size={13} /></button></div></div>}{evaluations.length > 0 && <div className="prior-evaluations"><p className="eyebrow mono">PREVIOUS EVALUATIONS</p>{evaluations.map(({ result, evaluatorName }) => <div key={result.id}><span>{evaluatorName || "Ovanite reviewer"} · {result.rubricVersion}</span><strong>{result.overallScore} / 5</strong></div>)}</div>}</section>}

          <section className="detail-panel"><div className="panel-heading"><div><p className="eyebrow mono">DECISION HISTORY</p><h2>Evaluator decisions</h2></div><span className="mono panel-count">{decisions.length} ENTRIES</span></div>{decisions.length ? <div className="decision-list">{decisions.map(({ result, decisionMakerName }) => <div className="decision-row" key={result.id}><span className={`status-pill status-${result.decision}`}>{statusLabel(result.decision)}</span><span>{decisionMakerName || "Reviewer"}</span><span>{dateLabel(result.decidedAt)}</span>{result.note && <p>{result.note}</p>}</div>)}</div> : <p className="empty-inline">No decision has been recorded. Decisions require a submitted rubric evaluation.</p>}</section>
        </div>

        <aside className="review-aside">
          <section className="detail-side-panel"><p className="eyebrow mono">PARTICIPANT / PRIVATE DATA</p><h3>{query.data.userName || submission.participantName || "Participant"}</h3><a className="participant-email" href={`mailto:${query.data.userEmail || submission.participantEmail}`}>{query.data.userEmail || submission.participantEmail || "Email unavailable"}</a><div className="fact-line"><span>Country</span><strong>{submission.country || "—"}</strong></div><div className="fact-line"><span>Profile / portfolio</span><strong>{submission.profileUrl ? <a className="text-link" href={submission.profileUrl} target="_blank" rel="noopener noreferrer">Open <ExternalLink size={12} /></a> : "—"}</strong></div><div className="fact-line"><span>Immutable ID</span><strong className="mono">{submission.id}</strong></div></section>
          <section className="detail-side-panel"><p className="eyebrow mono">WORKFLOW ACTIONS</p><p className="section-copy compact-copy">Every status change creates a dated audit event. The server rejects skipped and reversed transitions.</p>{!canReview && <div className="readonly-note"><LockKeyhole size={14} /> Viewer role · read-only</div>}{canReview && <div className="action-stack">
            {submission.status === "terms_accepted" && <button className="button button-primary" type="button" disabled={advanceMutation.isPending} onClick={() => void advance("validation")}>Start validation <ArrowUpRight size={14} /></button>}
            {submission.status === "validation" && latestValidation?.outcome === "pass" && <button className="button button-primary" type="button" disabled={advanceMutation.isPending} onClick={() => void advance("evaluation")}>Move to evaluation <ArrowUpRight size={14} /></button>}
            {submission.status === "evaluation" && evaluated && <><label className="field-label" htmlFor="decision-note">Decision note</label><textarea id="decision-note" rows={3} maxLength={5000} value={decisionNote} onChange={event => setDecisionNote(event.target.value)} placeholder="Optional rationale" /><button className="button button-primary" type="button" disabled={advanceMutation.isPending} onClick={() => void advance("eligible")}>Mark eligible</button><button className="button button-secondary" type="button" disabled={advanceMutation.isPending} onClick={() => void advance("not_eligible")}>Mark not eligible</button></>}
            {submission.status === "eligible" && <><label className="field-label" htmlFor="decision-note-eligible">Selection note</label><textarea id="decision-note-eligible" rows={2} maxLength={5000} value={decisionNote} onChange={event => setDecisionNote(event.target.value)} placeholder="Optional rationale" /><button className="button button-primary" type="button" disabled={advanceMutation.isPending} onClick={() => void advance("selected")}>Select project</button><button className="button button-secondary" type="button" disabled={advanceMutation.isPending} onClick={() => void advance("rejected")}>Record rejection</button></>}
            {submission.status === "not_eligible" && <><label className="field-label" htmlFor="decision-note-ineligible">Decision note</label><textarea id="decision-note-ineligible" rows={2} maxLength={5000} value={decisionNote} onChange={event => setDecisionNote(event.target.value)} placeholder="Optional rationale" /><button className="button button-secondary" type="button" disabled={advanceMutation.isPending} onClick={() => void advance("rejected")}>Record rejection</button></>}
            {isOwner && ["selected", "rejected", "withdrawn"].includes(submission.status) && <button className="button button-secondary" type="button" disabled={advanceMutation.isPending} onClick={() => void advance("archived")}>Archive record</button>}
            {!activeActions && !["selected", "rejected", "withdrawn"].includes(submission.status) && <span className="empty-inline">No workflow action is available in this state.</span>}
          </div>}</section>
          <section className="detail-side-panel"><p className="eyebrow mono">AUDIT TRAIL</p><div className="audit-timeline">{events.map(({ event, actorName }) => <div className="audit-event" key={event.id}><span className="audit-mark" /><div><strong>{statusLabel(event.eventType)}</strong><small>{actorName || event.actorRole} · {dateLabel(event.createdAt)}</small>{event.toStatus && <small>{statusLabel(event.fromStatus || "created")} → {statusLabel(event.toStatus)}</small>}</div></div>)}{!events.length && <p className="empty-inline">No events recorded.</p>}</div></section>
        </aside>
      </div>
      <section className="detail-panel validation-history-panel"><div className="panel-heading"><div><p className="eyebrow mono">VALIDATION RECORDS</p><h2>Recorded checks</h2></div><span className="mono panel-count">{validations.length} ENTRIES</span></div>{validations.length ? <div className="validation-history-list">{validations.map(({ result, evaluatorName, evaluatorRole }) => <article className="validation-history-record" key={result.id}><div className="validation-history-heading"><span className={`status-pill ${result.outcome === "pass" ? "status-selected" : "status-rejected"}`}>{result.outcome}</span><span>{evaluatorName || "Ovanite reviewer"} · {evaluatorRole}</span><time>{dateLabel(result.createdAt)}</time></div><div className="staff-declarations">{Object.entries(result.checks).map(([key, passed]) => <div key={key}><span className={passed ? "check-dot checked" : "check-dot"}>{passed ? <Check size={11} /> : <Circle size={11} />}</span><span>{validationChecks.find(item => item.id === key)?.label ?? key}</span><strong>{passed ? "Pass" : "Follow up"}</strong></div>)}</div>{result.notes && <p className="validation-record-notes"><strong>Reviewer notes</strong>{result.notes}</p>}</article>)}</div> : <p className="empty-inline">No validation result has been recorded.</p>}</section>
      <section className="detail-panel evaluation-history-panel"><div className="panel-heading"><div><p className="eyebrow mono">EVALUATION RECORDS</p><h2>Criterion-level results</h2></div><span className="mono panel-count">{evaluations.length} ENTRIES</span></div>{evaluations.length ? <div className="evaluation-history-list">{evaluations.map(({ result, evaluatorName, evaluatorRole }, index) => { const rubric = rubricQuery.data?.versions.find(item => item.version === result.rubricVersion); const criteria = rubric?.criteria ?? Object.keys(result.scores).map(id => ({ id, label: id, description: "", weight: 0 })); return <details className="evaluation-history-record" key={result.id} open={index === 0}><summary><span><strong>{evaluatorName || "Ovanite reviewer"}</strong><small>{evaluatorRole} · {dateLabel(result.createdAt)}</small></span><span className="mono evaluation-version">{result.rubricVersion}</span><strong className="evaluation-overall-score">{result.overallScore} / 5</strong></summary><div className="evaluation-result-grid">{criteria.map(criterion => <div key={criterion.id}><span>{criterion.label}<small>{criterion.weight ? ` · ${criterion.weight}%` : ""}</small></span><strong>{result.scores[criterion.id] ?? "—"} / 5</strong>{result.criterionNotes[criterion.id] && <p>{result.criterionNotes[criterion.id]}</p>}</div>)}</div>{result.notes && <p className="evaluation-overall-notes"><strong>Overall evaluator notes</strong>{result.notes}</p>}</details>; })}</div> : <p className="empty-inline">No evaluation has been submitted. Criterion scores and notes will appear here once recorded.</p>}</section>
    </div>
  );
}
