import { useEffect, useState } from "react";
import { CheckCircle2, FileText, LockKeyhole, Plus, RefreshCw, Save, ShieldAlert } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const placeholderText = `CONFIGURABLE PROGRAM TERMS — PLACEHOLDER\n\nThis text is a configuration placeholder, not approved legal language. Replace it with Ovanite's approved program terms before publishing.\n\nSubmitting a project authorizes Ovanite to review the materials under the published program rules. A submission does not itself guarantee selection, funding, employment, partnership, publication, or any other outcome.\n\nThe participant confirms that they own or have the rights needed to submit the materials and that they know of no third-party rights violation in the submitted materials.\n\nOvanite's published program rules and declarations will be versioned. The exact version accepted at submission and its timestamp will be retained with the submission record.`;
const formatDate = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default function TermsPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.portal.admin.termsVersions.useQuery();
  const createDraft = trpc.portal.admin.createTermsDraft.useMutation();
  const updateDraft = trpc.portal.admin.updateTermsDraft.useMutation();
  const publish = trpc.portal.admin.publishTerms.useMutation();
  const isOwner = user?.portalRole === "owner";
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("Ovanite Program Terms");
  const [content, setContent] = useState(placeholderText);
  const [editing, setEditing] = useState(false);
  const [existingDraft, setExistingDraft] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.data || existingDraft || editing) return;
    const draft = query.data.find(item => item.status === "draft");
    if (draft) {
      setVersion(draft.version);
      setTitle(draft.title);
      setContent(draft.content);
      setExistingDraft(true);
    }
  }, [query.data, existingDraft, editing]);

  function newDraft() {
    const nextVersion = query.data?.length ? `terms-${query.data.length + 1}.0` : "terms-1.0";
    setVersion(nextVersion);
    setTitle("Ovanite Program Terms");
    setContent(placeholderText);
    setExistingDraft(false);
    setEditing(true);
    setNotice("");
    setError("");
  }
  function openDraft() {
    const draft = query.data?.find(item => item.status === "draft");
    if (!draft) return;
    setVersion(draft.version);
    setTitle(draft.title);
    setContent(draft.content);
    setExistingDraft(true);
    setEditing(true);
  }
  async function saveDraft() {
    setError("");
    setNotice("");
    try {
      if (existingDraft) await updateDraft.mutateAsync({ version, title, content });
      else await createDraft.mutateAsync({ version, title, content });
      setExistingDraft(true);
      setNotice(`Draft ${version} saved.`);
      await utils.portal.admin.termsVersions.invalidate();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The terms draft could not be saved.");
    }
  }
  async function publishDraft() {
    if (!existingDraft) { setError("Save the draft before publishing."); return; }
    if (!window.confirm(`Publish terms ${version}? New participants will accept this exact text. Prior accepted versions remain unchanged.`)) return;
    setError("");
    setNotice("");
    try {
      await publish.mutateAsync({ version });
      setNotice(`Terms ${version} published. Previous acceptances remain attached to their original version.`);
      setEditing(false);
      await Promise.all([utils.portal.admin.termsVersions.invalidate(), utils.portal.currentTerms.get.invalidate()]);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The terms version could not be published.");
    }
  }

  const current = query.data?.find(item => item.status === "published");
  const versions = query.data ?? [];

  return (
    <div className="page-wrap">
      <div className="page-intro intro-rule">
        <div>
          <p className="eyebrow"><span className="marker" /> OVANITE ADMIN / PROGRAM RULES</p>
          <h1>Versioned program terms</h1>
          <p className="intro-copy">Publish clear rules for new submissions. An accepted version and timestamp are retained exactly with each participant record.</p>
        </div>
        {isOwner && !editing && <button className="button button-primary intro-cta" type="button" onClick={newDraft}><Plus size={15} /> New terms draft</button>}
      </div>

      <div className="terms-warning"><ShieldAlert size={17} /><div><strong>Legal text is configurable.</strong><p>Replace placeholder copy with approved Ovanite program terms before publishing. This portal does not invent legal guarantees or alter past acceptances.</p></div></div>
      {notice && <div className="success-banner" role="status"><CheckCircle2 size={16} />{notice}</div>}
      {error && <div className="inline-error request-error" role="alert">{error}</div>}

      {query.isLoading ? (
        <div className="loading-panel" role="status"><span className="loading-line" />Loading terms versions…</div>
      ) : query.error ? (
        <div className="state-panel state-error" role="alert"><strong>Terms versions could not be loaded.</strong><p>No terms have been changed.</p><button className="button button-secondary" type="button" onClick={() => void query.refetch()}><RefreshCw size={14} /> Retry</button></div>
      ) : (
        <div className="terms-admin-grid">
          <section className="terms-editor-panel">
            <div className="section-heading-row">
              <div><p className="eyebrow mono">{editing ? "DRAFT EDITOR" : "CURRENT VERSION"}</p><h2>{editing ? "Configure the next version" : current?.title || "No published terms"}</h2></div>
              {!editing && versions.some(item => item.status === "draft") && isOwner && <button className="text-link" type="button" onClick={openDraft}>Edit draft</button>}
            </div>
            {editing ? (
              <div className="terms-editor">
                <label className="field-label" htmlFor="terms-version">Version identifier</label><input id="terms-version" value={version} onChange={event => setVersion(event.target.value)} disabled={existingDraft} placeholder="terms-1.0" />
                <label className="field-label" htmlFor="terms-title">Display title</label><input id="terms-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={200} />
                <label className="field-label" htmlFor="terms-content">Program terms text</label><p className="field-hint">This exact text becomes immutable after publication and remains visible in each accepted-version record.</p>
                <textarea id="terms-content" value={content} onChange={event => setContent(event.target.value)} rows={17} maxLength={50000} />
                <div className="terms-editor-note"><ShieldAlert size={15} /><span>Placeholder text must be replaced with approved legal language before publication.</span></div>
                <div className="wizard-actions"><button className="button button-secondary" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button button-secondary" type="button" disabled={!isOwner || createDraft.isPending || updateDraft.isPending} onClick={() => void saveDraft()}><Save size={14} /> Save draft</button><button className="button button-primary" type="button" disabled={!isOwner || publish.isPending || !existingDraft} onClick={() => void publishDraft()}>Publish version</button></div>
              </div>
            ) : current ? (
              <div className="published-terms"><div className="terms-document-head"><span className="mono">VERSION / {current.version}</span><span className="version-state published">PUBLISHED</span></div><pre>{current.content}</pre></div>
            ) : (
              <div className="empty-state terms-empty"><FileText size={22} /><h3>No program terms are published.</h3><p>Submissions remain disabled until an owner publishes the approved terms.</p>{isOwner && <button className="button button-secondary" type="button" onClick={newDraft}>Create the first draft</button>}</div>
            )}
            {!isOwner && <p className="readonly-note"><LockKeyhole size={14} /> Only the owner can create, edit, or publish terms.</p>}
          </section>

          <aside className="terms-history-panel">
            <p className="eyebrow mono">VERSION HISTORY</p><h2>Accepted text stays put.</h2>
            <p className="section-copy compact-copy">A published version is never overwritten. Later edits create a new version; accepted records keep their original version reference and timestamp.</p>
            {versions.length ? <div className="terms-version-list">{versions.map(item => (
              <article className="terms-version-card" key={item.version}>
                <div className="version-card-top"><span className={`version-state ${item.status}`}>{item.status}</span><span className="mono">{item.version}</span></div>
                <h3>{item.title}</h3><p>{item.content.slice(0, 155)}{item.content.length > 155 ? "…" : ""}</p>
                <div className="version-card-meta"><span>{item.status === "published" ? "Published" : item.status === "retired" ? "Retired" : "Created"} · {formatDate(item.publishedAt || item.createdAt)}</span><span className="mono">ACCEPTANCES REFERENCE THIS VERSION</span></div>
              </article>
            ))}</div> : <div className="empty-inline">No terms versions recorded.</div>}
            {versions.some(item => item.status === "draft") && !isOwner && <div className="readonly-note"><LockKeyhole size={14} /> Draft editing and publication are owner-only.</div>}
          </aside>
        </div>
      )}

      <section className="declarations-reference"><div><p className="eyebrow mono">FIXED ACCEPTANCE DECLARATIONS</p><h2>Recorded with every submission</h2></div><ul><li>Rights to submit the software and materials</li><li>No known third-party rights violations</li><li>No promise of selection, funding, employment, partnership, publication, or another outcome</li><li>Authorization for evaluation under published program rules</li><li>Explicit acceptance of the current version</li></ul></section>
    </div>
  );
}
