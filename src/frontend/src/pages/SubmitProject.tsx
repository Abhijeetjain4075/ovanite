import { useState } from "react";
import { Link } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import {
  MicroBadge,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
} from "@/components/shared/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  IntakeError,
  type IntakeFieldErrors,
  isDuplicateIntakeResult,
  isIntakeOpen,
  submitIntake,
} from "@/lib/intake";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILES,
  formatBytes,
  validateAttachmentSet,
} from "@/lib/uploads";
import {
  validateEmail,
  validateMessage,
  validateName,
  validateNote,
} from "@/lib/validation";

type Field = "name" | "email" | "project" | "message" | "stack" | "repository";

const FIELD_IDS: Record<Field, string> = {
  name: "intake-name",
  email: "intake-email",
  project: "intake-project",
  message: "intake-message",
  stack: "intake-stack",
  repository: "intake-repository",
};

const STATUS_OPTIONS = [
  { value: "", label: "Select a stage" },
  { value: "idea", label: "Idea" },
  { value: "prototype", label: "Prototype" },
  { value: "private-beta", label: "Private beta" },
  { value: "live", label: "Live with users" },
] as const;

function validateRepository(value: string): string | undefined {
  if (value.trim() === "") return undefined;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:") return "Use an https:// link.";
  } catch {
    return "Enter a valid https:// link.";
  }
  return undefined;
}

/**
 * Participant intake.
 *
 * The form only exists when this build has a configured intake service; an
 * unconfigured deployment shows the same closed overview the page has always
 * shown. A visitor is told the submission was received only after the service
 * stored it.
 */
export default function SubmitProject() {
  const open = isIntakeOpen();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState("");
  const [message, setMessage] = useState("");
  const [stack, setStack] = useState("");
  const [repository, setRepository] = useState("");
  const [status, setStatus] = useState("");
  const [consent, setConsent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const [errors, setErrors] = useState<
    Partial<Record<Field | "consent", string>>
  >({});
  const [pending, setPending] = useState(false);
  const [received, setReceived] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  function validate(): boolean {
    const next: Partial<Record<Field | "consent", string>> = {
      name: validateName(name),
      email: validateEmail(email),
      project: project.trim() === "" ? "Please name the project." : undefined,
      message: validateMessage(message),
      stack: validateNote(stack),
      repository: validateRepository(repository),
      consent: consent ? undefined : "Please accept the privacy notice.",
    };
    setErrors(next);
    return Object.values(next).every((value) => value === undefined);
  }

  function applyServerErrors(fields: IntakeFieldErrors): void {
    if (typeof fields.files === "string") setFileError(fields.files);
    const mapped: Partial<Record<Field, string>> = {};
    for (const field of Object.keys(FIELD_IDS) as Field[]) {
      const message = fields[field];
      if (typeof message === "string") mapped[field] = message;
    }
    if (Object.keys(mapped).length > 0) setErrors(mapped);
  }

  /**
   * Merges a new pick into the current selection so replacing one file does not
   * silently drop the others. The first problem is shown once, before upload.
   */
  function handleFiles(event: React.ChangeEvent<HTMLInputElement>): void {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length === 0) return;

    const merged = [...files];
    for (const file of picked) {
      const duplicate = merged.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      );
      if (!duplicate) merged.push(file);
    }

    const problem = validateAttachmentSet(merged);
    setFileError(problem ?? null);
    if (!problem) setFiles(merged);
    // Let the same file be picked again after it was removed.
    event.target.value = "";
  }

  function removeFile(index: number): void {
    const next = files.filter((_, position) => position !== index);
    setFiles(next);
    setFileError(validateAttachmentSet(next) ?? null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    setDuplicate(false);
    if (!validate()) return;

    const attachmentProblem = validateAttachmentSet(files);
    if (attachmentProblem) {
      setFileError(attachmentProblem);
      return;
    }

    setPending(true);
    try {
      const outcome = await submitIntake(
        "participant",
        {
          name: name.trim(),
          email: email.trim(),
          project: project.trim(),
          message: message.trim(),
          ...(stack.trim() ? { stack: stack.trim() } : {}),
          ...(repository.trim() ? { repository: repository.trim() } : {}),
          ...(status ? { status } : {}),
        },
        { files },
      );
      if (isDuplicateIntakeResult(outcome)) {
        setDuplicate(true);
        return;
      }
      setReceived(
        outcome.status === "received" ? (outcome.reference ?? "") : "",
      );
    } catch (error) {
      if (error instanceof IntakeError && error.reason === "invalid") {
        applyServerErrors(error.fields);
        setFailure("Please check the highlighted fields.");
      } else {
        setFailure(
          error instanceof Error
            ? error.message
            : "We could not accept your submission. Nothing was submitted.",
        );
      }
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <>
        <PageMeta
          title="Participant submission"
          description="Participant submission intake is not open on this deployment."
        />
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Participants", to: "/participants" },
            { label: "Submit" },
          ]}
        />
        <Container className="py-16 md:py-24">
          <div className="max-w-2xl border-t border-border pt-5">
            <span className="eyebrow">Submission intake</span>
            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Submission intake is not open.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              This deployment is not accepting participant submissions yet, and
              nothing entered here would be stored. The review process and its
              stages are described on the participants page.
            </p>
            <div className="mt-9">
              <SecondaryButton asChild>
                <Link to="/participants">Back to participants</Link>
              </SecondaryButton>
            </div>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Participant submission"
        description="Submit a software project for Ovanite's structured review process."
      />
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Participants", to: "/participants" },
          { label: "Submit" },
        ]}
      />

      <Container className="py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
                02
              </span>
              <span className="eyebrow">Participant intake</span>
            </div>
            <h1 className="mt-7 text-balance font-display text-4xl font-bold tracking-tight md:text-5xl">
              Submit a project for review.
            </h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Tell us what you built, who it is for, and where we can see it. A
              submission is a review request: it is not a promise of selection,
              funding, employment, or partnership.
            </p>
            <div className="mt-8 space-y-3 text-sm text-muted-foreground">
              <p>
                We ask only for what the review needs. You can request deletion
                of your submission at any time through the contact page.
              </p>
              <p>
                Read the{" "}
                <Link to="/privacy" className="underline hover:text-foreground">
                  privacy notice
                </Link>{" "}
                before submitting.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <SurfaceCard className="p-6 md:p-8">
              {received !== null ? (
                <output aria-live="polite" data-ocid="intake.received_state">
                  <h2 className="font-display text-2xl font-semibold">
                    Submission received.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    We have your submission and will review it against the
                    published rubric. No further action is needed.
                  </p>
                  {received ? (
                    <p className="mt-4 font-mono text-xs text-muted-foreground">
                      Reference: {received}
                    </p>
                  ) : null}
                  {files.length > 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {files.length === 1
                        ? "1 attachment stored."
                        : `${files.length} attachments stored.`}
                    </p>
                  ) : null}
                  <div className="mt-6">
                    <SecondaryButton asChild>
                      <Link to="/participants">Back to participants</Link>
                    </SecondaryButton>
                  </div>
                </output>
              ) : (
                <form
                  noValidate
                  onSubmit={handleSubmit}
                  data-ocid="intake.form"
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="eyebrow">Project details</span>
                    <MicroBadge>Open</MicroBadge>
                  </div>

                  {duplicate ? (
                    <output
                      aria-live="polite"
                      data-ocid="intake.duplicate_state"
                      className="block border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-foreground"
                    >
                      We already have this exact submission. There is no need to
                      send it again.
                    </output>
                  ) : null}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={FIELD_IDS.name} className="mb-2">
                        Your name
                      </Label>
                      <Input
                        id={FIELD_IDS.name}
                        name="name"
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={
                          errors.name ? `${FIELD_IDS.name}-error` : undefined
                        }
                        data-ocid="intake.name_input"
                        className="h-11 rounded-sm"
                      />
                      {errors.name ? (
                        <p
                          id={`${FIELD_IDS.name}-error`}
                          role="alert"
                          className="mt-2 text-sm text-destructive"
                        >
                          {errors.name}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <Label htmlFor={FIELD_IDS.email} className="mb-2">
                        Email
                      </Label>
                      <Input
                        id={FIELD_IDS.email}
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={
                          errors.email ? `${FIELD_IDS.email}-error` : undefined
                        }
                        data-ocid="intake.email_input"
                        className="h-11 rounded-sm"
                      />
                      {errors.email ? (
                        <p
                          id={`${FIELD_IDS.email}-error`}
                          role="alert"
                          className="mt-2 text-sm text-destructive"
                        >
                          {errors.email}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={FIELD_IDS.project} className="mb-2">
                      Project name
                    </Label>
                    <Input
                      id={FIELD_IDS.project}
                      name="project"
                      value={project}
                      onChange={(event) => setProject(event.target.value)}
                      aria-invalid={errors.project ? true : undefined}
                      aria-describedby={
                        errors.project
                          ? `${FIELD_IDS.project}-error`
                          : undefined
                      }
                      data-ocid="intake.project_input"
                      className="h-11 rounded-sm"
                    />
                    {errors.project ? (
                      <p
                        id={`${FIELD_IDS.project}-error`}
                        role="alert"
                        className="mt-2 text-sm text-destructive"
                      >
                        {errors.project}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor={FIELD_IDS.message} className="mb-2">
                      What does it do, and what evidence supports it?
                    </Label>
                    <Textarea
                      id={FIELD_IDS.message}
                      name="message"
                      rows={7}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      aria-invalid={errors.message ? true : undefined}
                      aria-describedby={
                        errors.message
                          ? `${FIELD_IDS.message}-error`
                          : undefined
                      }
                      data-ocid="intake.message_textarea"
                      className="min-h-36 rounded-sm"
                    />
                    {errors.message ? (
                      <p
                        id={`${FIELD_IDS.message}-error`}
                        role="alert"
                        className="mt-2 text-sm text-destructive"
                      >
                        {errors.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={FIELD_IDS.stack} className="mb-2">
                        Stack (optional)
                      </Label>
                      <Input
                        id={FIELD_IDS.stack}
                        name="stack"
                        value={stack}
                        onChange={(event) => setStack(event.target.value)}
                        aria-invalid={errors.stack ? true : undefined}
                        aria-describedby={
                          errors.stack ? `${FIELD_IDS.stack}-error` : undefined
                        }
                        data-ocid="intake.stack_input"
                        className="h-11 rounded-sm"
                      />
                      {errors.stack ? (
                        <p
                          id={`${FIELD_IDS.stack}-error`}
                          role="alert"
                          className="mt-2 text-sm text-destructive"
                        >
                          {errors.stack}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <Label htmlFor="intake-status" className="mb-2">
                        Stage
                      </Label>
                      <select
                        id="intake-status"
                        name="status"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        data-ocid="intake.status_input"
                        className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={FIELD_IDS.repository} className="mb-2">
                      Link to the work (optional)
                    </Label>
                    <Input
                      id={FIELD_IDS.repository}
                      name="repository"
                      inputMode="url"
                      placeholder="https://"
                      value={repository}
                      onChange={(event) => setRepository(event.target.value)}
                      aria-invalid={errors.repository ? true : undefined}
                      aria-describedby={
                        errors.repository
                          ? `${FIELD_IDS.repository}-error`
                          : undefined
                      }
                      data-ocid="intake.repository_input"
                      className="h-11 rounded-sm"
                    />
                    {errors.repository ? (
                      <p
                        id={`${FIELD_IDS.repository}-error`}
                        role="alert"
                        className="mt-2 text-sm text-destructive"
                      >
                        {errors.repository}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="intake-files" className="mb-2">
                      Files (optional)
                    </Label>
                    <input
                      id="intake-files"
                      name="files"
                      type="file"
                      multiple
                      accept={ACCEPT_ATTRIBUTE}
                      onChange={handleFiles}
                      data-ocid="intake.files_input"
                      aria-describedby="intake-files-hint"
                      aria-invalid={fileError ? true : undefined}
                      className="block w-full cursor-pointer rounded-sm border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
                    />
                    <p
                      id="intake-files-hint"
                      className="mt-2 text-xs text-muted-foreground"
                    >
                      A zip or tarball of your source, a PDF, or a single source
                      file. Up to {MAX_FILES} files, 20 MB each and 25 MB in
                      total. Files are reviewed privately and never published.
                    </p>
                    {fileError ? (
                      <p
                        role="alert"
                        data-ocid="intake.files_error"
                        className="mt-2 text-sm text-destructive"
                      >
                        {fileError}
                      </p>
                    ) : null}
                    {files.length > 0 ? (
                      <ul
                        data-ocid="intake.files_list"
                        className="mt-3 space-y-2"
                      >
                        {files.map((file, index) => (
                          <li
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between gap-3 border border-border px-3 py-2 text-sm"
                          >
                            <span className="truncate">
                              {file.name}
                              <span className="ml-2 font-mono text-xs text-muted-foreground">
                                {formatBytes(file.size)}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              data-ocid={`intake.files_remove.${index + 1}`}
                              className="text-xs text-muted-foreground underline hover:text-foreground"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div>
                    <label className="flex items-start gap-3 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        name="consent"
                        checked={consent}
                        onChange={(event) => setConsent(event.target.checked)}
                        aria-invalid={errors.consent ? true : undefined}
                        data-ocid="intake.consent_checkbox"
                        className="mt-1 h-4 w-4 rounded-sm border border-input"
                      />
                      <span>
                        I have read the{" "}
                        <Link
                          to="/privacy"
                          className="underline hover:text-foreground"
                        >
                          privacy notice
                        </Link>{" "}
                        and agree to Ovanite storing this submission for review.
                      </span>
                    </label>
                    {errors.consent ? (
                      <p role="alert" className="mt-2 text-sm text-destructive">
                        {errors.consent}
                      </p>
                    ) : null}
                  </div>

                  {failure ? (
                    <p
                      role="alert"
                      data-ocid="intake.error_state"
                      className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                    >
                      {failure}
                    </p>
                  ) : null}

                  <PrimaryButton
                    type="submit"
                    size="lg"
                    disabled={pending}
                    data-ocid="intake.submit_button"
                  >
                    {pending ? "Submitting…" : "Submit for review"}
                  </PrimaryButton>
                </form>
              )}
            </SurfaceCard>
          </div>
        </div>
      </Container>
    </>
  );
}
