import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, CircleHelp, ExternalLink, Save, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { TextAreaField, TextField, SelectField, submissionCategories, projectStatuses, type FieldErrors } from "@/components/SubmissionFields";
import { useAuth } from "@/_core/hooks/useAuth";
import { EMPTY_SUBMISSION, type ProjectStatus, type SubmissionFormData } from "@/types/portal";
import { trpc } from "@/lib/trpc";

const declarations = [
  { id: "rights", label: "I own or have the rights needed to submit this software and its materials." },
  { id: "thirdParty", label: "I know of no third-party rights violation in the materials I am submitting." },
  { id: "noGuarantee", label: "I understand this submission does not itself guarantee selection, funding, employment, partnership, publication, or any other outcome." },
  { id: "evaluation", label: "I authorize Ovanite to evaluate this submission under the published program rules." },
  { id: "terms", label: "I have read and accept the current Ovanite program terms." },
] as const;
type DeclarationKey = (typeof declarations)[number]["id"];
type Acceptance = Record<DeclarationKey, boolean>;
const emptyAcceptance: Acceptance = { rights: false, thirdParty: false, noGuarantee: false, evaluation: false, terms: false };
const steps = ["Participant", "Project", "Terms & review"];

function safeLink(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

export default function SubmitPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const termsQuery = trpc.portal.currentTerms.get.useQuery();
  const draftQuery = trpc.portal.latestDraft.useQuery();
  const saveDraft = trpc.portal.saveDraft.useMutation();
  const submitMutation = trpc.portal.submit.useMutation();
  const [data, setData] = useState<SubmissionFormData>({
    ...EMPTY_SUBMISSION,
    participantName: user?.name ?? "",
    participantEmail: user?.email ?? "",
  });
  const [draftId, setDraftId] = useState<string>();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [acceptance, setAcceptance] = useState<Acceptance>(emptyAcceptance);
  const [acceptanceError, setAcceptanceError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedLabel, setSavedLabel] = useState("Draft saves automatically");
  const [requestError, setRequestError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!draftQuery.isSuccess || hydrated) return;
    if (draftQuery.data) {
      setDraftId(draftQuery.data.id);
      setData({ ...EMPTY_SUBMISSION, ...draftQuery.data.data } as SubmissionFormData);
    }
    setHydrated(true);
  }, [draftQuery.data, draftQuery.isSuccess, hydrated]);

  useEffect(() => {
    if (!hydrated || !dirty || saveDraft.isPending || success) return;
    const snapshot = data;
    const timer = window.setTimeout(async () => {
      try {
        const saved = await saveDraft.mutateAsync({ id: draftId, data: snapshot });
        setDraftId(saved.id);
        if (dataRef.current === snapshot) {
          setDirty(false);
          setSavedLabel(`Saved at ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date())}`);
        }
      } catch {
        setSavedLabel("Draft save failed — your current page still has your changes");
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [data, dirty, draftId, hydrated, saveDraft, success]);

  useEffect(() => {
    if (!dirty && !saveDraft.isPending) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty, saveDraft.isPending]);

  const setField = (key: keyof SubmissionFormData, value: string) => {
    setData(current => ({ ...current, [key]: value }));
    setDirty(true);
    setSavedLabel("Saving draft…");
    setRequestError("");
  };

  function validateParticipant() {
    const next: FieldErrors = {};
    if (!data.participantName.trim()) next.participantName = "Enter your name.";
    if (!data.participantEmail.trim()) next.participantEmail = "Enter your email address.";
    else if (!/^\S+@\S+\.\S+$/.test(data.participantEmail)) next.participantEmail = "Enter a valid email address.";
    if (!data.country.trim()) next.country = "Enter your country or region.";
    if (data.profileUrl && !safeLink(data.profileUrl)) next.profileUrl = "Use a complete http or https URL.";
    return next;
  }
  function validateProject() {
    const next: FieldErrors = {};
    if (!data.projectName.trim()) next.projectName = "Enter a project name.";
    if (!data.shortDescription.trim()) next.shortDescription = "Add a short project description.";
    if (!data.problemSolved.trim()) next.problemSolved = "Describe the problem your software solves.";
    if (!data.category) next.category = "Select a project category.";
    if (!data.technologyStack.trim()) next.technologyStack = "List the main technologies used.";
    if (!data.projectStatus) next.projectStatus = "Select the project's current status.";
    const links: Array<keyof SubmissionFormData> = ["repositoryUrl", "liveUrl", "documentationUrl", "demoVideoUrl"];
    for (const key of links) if (data[key] && !safeLink(data[key])) next[key] = "Use a complete http or https URL without embedded credentials.";
    if (!links.some(key => Boolean(data[key].trim()))) next.repositoryUrl = "Add at least one repository, live demo, documentation, or demo video link.";
    return next;
  }
  function focusFirstError(next: FieldErrors) {
    const first = Object.keys(next)[0];
    if (first) requestAnimationFrame(() => document.getElementById(first)?.focus());
  }
  function continueStep() {
    const next = step === 0 ? validateParticipant() : validateProject();
    setErrors(next);
    if (Object.keys(next).length) { focusFirstError(next); return; }
    setStep(current => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitProject() {
    setRequestError("");
    if (!termsQuery.data) {
      setRequestError("Submissions are unavailable until Ovanite publishes the current program terms.");
      return;
    }
    const missing = declarations.some(item => !acceptance[item.id]);
    setAcceptanceError(missing);
    if (missing) {
      document.getElementById("declaration-rights")?.focus();
      return;
    }
    try {
      const id = draftId ?? (await saveDraft.mutateAsync({ data })).id;
      setDraftId(id);
      const result = await submitMutation.mutateAsync({
        id,
        termsVersion: termsQuery.data.version,
        data: { ...data, projectStatus: data.projectStatus as ProjectStatus },
        declarations: { rights: true, thirdParty: true, noGuarantee: true, evaluation: true, terms: true },
      });
      setSuccess(true);
      setDirty(false);
      await Promise.all([utils.portal.mySubmissions.invalidate(), utils.portal.latestDraft.invalidate()]);
      window.setTimeout(() => navigate(`/submission/${result.id}`), 700);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not submit this project. Your draft remains saved.";
      setRequestError(message);
      if (message.toLowerCase().includes("terms")) void termsQuery.refetch();
    }
  }

  if (success) return <div className="page-wrap"><div className="success-panel" role="status"><span className="success-icon"><CheckCircle2 size={24} /></span><p className="eyebrow mono">SUBMISSION RECEIVED</p><h1>Your work is in the queue.</h1><p>We’ve recorded the current terms version and your acceptance. You’ll find the complete status history in your submission record.</p><span className="mono success-meta">REDIRECTING TO YOUR RECORD…</span></div></div>;

  return (
    <div className="page-wrap submit-wrap">
      <div className="page-intro intro-rule">
        <div><p className="eyebrow"><span className="marker" /> SUBMISSION / NEW RECORD</p><h1>Show us what you built.</h1><p className="intro-copy">Start with the problem, then give reviewers clear evidence of the software you made.</p></div>
        <div className="draft-indicator" role="status" aria-live="polite"><Save size={14} />{saveDraft.isPending ? "Saving draft…" : savedLabel}</div>
      </div>

      <nav className="wizard-steps" aria-label="Submission steps">
        {steps.map((label, index) => <button type="button" key={label} className={`wizard-step ${index === step ? "is-current" : index < step ? "is-complete" : ""}`} onClick={() => index < step && setStep(index)} aria-current={index === step ? "step" : undefined} disabled={index > step}><span className="step-number">{index < step ? <Check size={13} /> : `0${index + 1}`}</span><span>{label}</span></button>)}
      </nav>

      <div className="submit-layout">
        <main className="form-main">
          {requestError && <div className="inline-error request-error" role="alert"><AlertCircle size={16} />{requestError}</div>}
          {step === 0 && <section className="form-section" aria-labelledby="participant-title">
            <p className="eyebrow mono">01 / PARTICIPANT</p><h2 id="participant-title">Who is submitting?</h2><p className="section-copy">We use this information to associate the record with your account and contact you about the review.</p>
            <div className="form-grid two-col">
              <TextField id="participantName" label="Full name" value={data.participantName} onChange={value => setField("participantName", value)} required error={errors.participantName} autoComplete="name" />
              <TextField id="participantEmail" label="Email address" type="email" value={data.participantEmail} onChange={value => setField("participantEmail", value)} required error={errors.participantEmail} autoComplete="email" />
              <TextField id="country" label="Country or region" value={data.country} onChange={value => setField("country", value)} required error={errors.country} autoComplete="country-name" placeholder="For example, Canada" />
              <TextField id="profileUrl" label="Profile or portfolio URL" type="url" value={data.profileUrl} onChange={value => setField("profileUrl", value)} error={errors.profileUrl} placeholder="https://" hint="Optional. Share a relevant professional profile or portfolio." />
            </div>
            <div className="privacy-inline"><ShieldCheck size={16} /><span>Your contact details are visible only to you and authorized Ovanite reviewers.</span></div>
          </section>}

          {step === 1 && <section className="form-section" aria-labelledby="project-title">
            <p className="eyebrow mono">02 / PROJECT</p><h2 id="project-title">The work, in context.</h2><p className="section-copy">Link to the software and supporting evidence. Source-code uploads are not required.</p>
            <div className="form-grid two-col">
              <TextField id="projectName" label="Project name" value={data.projectName} onChange={value => setField("projectName", value)} required error={errors.projectName} maxLength={180} />
              <SelectField id="category" label="Category" value={data.category} onChange={value => setField("category", value)} required options={submissionCategories} placeholder="Choose a category" error={errors.category} />
              <div className="span-two"><TextField id="shortDescription" label="Short description" value={data.shortDescription} onChange={value => setField("shortDescription", value)} required error={errors.shortDescription} hint="A clear, one-sentence description of what the product does." maxLength={500} /></div>
              <div className="span-two"><TextAreaField id="problemSolved" label="Problem solved" value={data.problemSolved} onChange={value => setField("problemSolved", value)} required error={errors.problemSolved} rows={4} hint="Who experiences the problem, and what changes when your software works?" maxLength={10000} /></div>
              <TextField id="repositoryUrl" label="Repository URL" type="url" value={data.repositoryUrl} onChange={value => setField("repositoryUrl", value)} error={errors.repositoryUrl} placeholder="https://github.com/…" hint="One or more evidence links are required." />
              <TextField id="liveUrl" label="Live product or demo URL" type="url" value={data.liveUrl} onChange={value => setField("liveUrl", value)} error={errors.liveUrl} placeholder="https://" />
              <TextField id="documentationUrl" label="Documentation URL" type="url" value={data.documentationUrl} onChange={value => setField("documentationUrl", value)} error={errors.documentationUrl} placeholder="https://" />
              <TextField id="demoVideoUrl" label="Demo video URL" type="url" value={data.demoVideoUrl} onChange={value => setField("demoVideoUrl", value)} error={errors.demoVideoUrl} placeholder="https://" />
              <TextAreaField id="technologyStack" label="Technology stack" value={data.technologyStack} onChange={value => setField("technologyStack", value)} required error={errors.technologyStack} rows={2} placeholder="TypeScript, React, PostgreSQL…" hint="List the main technologies. No need to include every dependency." maxLength={2000} />
              <SelectField id="projectStatus" label="Project status" value={data.projectStatus} onChange={value => setField("projectStatus", value)} required options={projectStatuses} placeholder="Select current status" error={errors.projectStatus} />
            </div>
          </section>}

          {step === 2 && <section className="form-section" aria-labelledby="terms-title">
            <p className="eyebrow mono">03 / TERMS & REVIEW</p><h2 id="terms-title">Read before you submit.</h2><p className="section-copy">Review the currently published program terms and each declaration. Your exact accepted version and timestamp will be retained with this record.</p>
            {termsQuery.isLoading ? <div className="loading-panel" role="status"><span className="loading-line" />Loading the current terms…</div> : termsQuery.error ? <div className="state-panel state-error" role="alert"><strong>Current program terms are unavailable.</strong><p>Try again. No acceptance has been recorded.</p><button className="button button-secondary" type="button" onClick={() => void termsQuery.refetch()}>Retry</button></div> : !termsQuery.data ? <div className="terms-unavailable"><CircleHelp size={18} /><div><strong>Submissions are not open yet.</strong><p>Ovanite has not published a current program-terms version. You can save this project as a draft and return when terms are available.</p></div></div> : <>
              <div className="terms-document"><div className="terms-document-head"><span className="mono">CURRENT VERSION / {termsQuery.data.version}</span><span className="terms-configurable">Published program text</span></div><h3>{termsQuery.data.title}</h3><div className="terms-content">{termsQuery.data.content}</div><div className="terms-declarations"><p className="eyebrow mono">DECLARATIONS RECORDED WITH ACCEPTANCE</p>{declarations.map(item => <p key={item.id}>{item.label}</p>)}</div></div>
              <div className="declarations-list" aria-describedby={acceptanceError ? "declaration-error" : undefined}>
                {declarations.map((item, index) => <label className="declaration-row" key={item.id} htmlFor={`declaration-${item.id}`}>
                  <input id={`declaration-${item.id}`} type="checkbox" checked={acceptance[item.id]} onChange={event => { setAcceptance(current => ({ ...current, [item.id]: event.target.checked })); setAcceptanceError(false); }} />
                  <span className="declaration-copy"><span className="mono declaration-index">0{index + 1}</span>{item.label}</span>
                </label>)}
                {acceptanceError && <p className="field-error" id="declaration-error" role="alert">Confirm each declaration before submitting.</p>}
              </div>
            </>}
            <div className="review-summary"><p className="eyebrow mono">FINAL REVIEW</p><div><span>Project</span><strong>{data.projectName || "Not entered"}</strong></div><div><span>Evidence links</span><strong>{[data.repositoryUrl, data.liveUrl, data.documentationUrl, data.demoVideoUrl].filter(Boolean).length} provided</strong></div><div><span>Participant</span><strong>{data.participantName || "Not entered"}</strong></div>{termsQuery.data && <div><span>Terms version</span><strong className="mono">{termsQuery.data.version}</strong></div>}</div>
            <div className="outcome-note"><ShieldCheck size={16} /><span>Submitting does not guarantee selection, funding, employment, partnership, publication, or any other outcome. The review process and any decision are recorded separately.</span></div>
          </section>}

          <div className="wizard-actions">
            {step > 0 ? <button className="button button-secondary" type="button" onClick={() => setStep(current => current - 1)}><ArrowLeft size={15} /> Back</button> : <span />}
            {step < 2 ? <button className="button button-primary" type="button" onClick={continueStep}>Continue <ArrowRight size={15} /></button> : <button className="button button-primary" type="button" onClick={() => void submitProject()} disabled={submitMutation.isPending || saveDraft.isPending || !termsQuery.data}>{submitMutation.isPending ? "Submitting…" : "Submit project"}<ArrowRight size={15} /></button>}
          </div>
          <p className="form-required-note">Fields marked <span className="required-mark">*</span> are required. Drafts remain private until submitted.</p>
        </main>
        <aside className="submit-aside">
          <div className="aside-note"><span className="aside-icon"><ExternalLink size={17} /></span><p className="eyebrow mono">EVIDENCE FIRST</p><h3>Links, not uploads.</h3><p>Share repository, demo, documentation, or video links. There is no source-code upload requirement.</p></div>
          <div className="aside-note"><span className="aside-icon"><ShieldCheck size={17} /></span><p className="eyebrow mono">RECORDED ACCEPTANCE</p><h3>Versioned terms.</h3><p>Your accepted terms version and timestamp remain tied to this submission. Future terms updates do not change prior records.</p></div>
          <div className="draft-save-note"><Save size={15} /><span>{saveDraft.isPending ? "Saving the latest draft…" : savedLabel}</span></div>
        </aside>
      </div>
    </div>
  );
}
