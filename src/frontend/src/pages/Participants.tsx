import { Link } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { PrimaryButton, SecondaryButton, SurfaceCard, MicroBadge } from "@/components/shared/primitives";

const principles = [
  ["01", "Problem first", "Start with the problem, the people affected, and the evidence that the software changes something meaningful."],
  ["02", "Working software", "Submit a real product, repository, demo, or documentation so the work can be evaluated on evidence rather than promises."],
  ["03", "Structured review", "Ovanite evaluates submissions against a versioned rubric and preserves the review history for each record."],
  ["04", "Clear decisions", "Evaluation and selection are separate records. A score is not a promise of selection, funding, employment, or partnership."],
] as const;

export default function Participants() {
  return (
    <>
      <PageMeta
        title="Participant Platform"
        description="Submit software to Ovanite and follow its evaluation record through a structured participant platform."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Participants" }]} />

      <Container className="py-16 md:py-24">
        <div className="grid gap-12 border-t border-border pt-5 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">01</span>
              <span className="eyebrow">Ovanite Participant Platform</span>
            </div>
            <h1 className="mt-7 max-w-4xl text-balance font-display text-5xl font-bold tracking-tight md:text-7xl">
              Put the work in front of a serious review.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Submit software, preserve your evidence, accept the current program terms, and follow the record as it moves through validation, evaluation, and decision.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryButton asChild size="lg">
                <Link to="/participants/submit" data-ocid="participants.start_submission_button">
                  Start a submission
                </Link>
              </PrimaryButton>
              <SecondaryButton asChild size="lg">
                <Link to="/participants/my-submissions" data-ocid="participants.my_submissions_button">
                  My submissions
                </Link>
              </SecondaryButton>
            </div>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted-foreground">
              The participant interface is being connected to Ovanite's native identity and backend layer. Submission records will use your authenticated Ovanite identity, not an email address as the ownership key.
            </p>
          </div>

          <SurfaceCard className="lg:col-span-5 p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="eyebrow">Submission lifecycle</span>
              <MicroBadge>Native Ovanite</MicroBadge>
            </div>
            <div className="mt-6 space-y-4 font-mono text-xs">
              {["DRAFT", "SUBMITTED", "VALIDATION", "EVALUATION", "ELIGIBLE / NOT ELIGIBLE", "SELECTED / REJECTED"].map((state, index) => (
                <div key={state} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border text-[10px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={index === 0 ? "text-foreground" : "text-muted-foreground"}>{state}</span>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        <div className="mt-20 grid gap-0 border-y border-border md:grid-cols-2">
          {principles.map(([number, title, body]) => (
            <article key={number} className="border-b border-border p-6 last:border-b-0 md:p-8 md:odd:border-r md:[&:nth-last-child(-n+2)]:border-b-0">
              <p className="font-mono text-xs tracking-[0.2em] text-primary">{number}</p>
              <h2 className="mt-4 font-display text-2xl font-semibold">{title}</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 border border-border bg-muted/30 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Already have a record?</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Return to your submissions.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Review status, terms acceptance, validation, evaluation history, and decisions.</p>
            </div>
            <SecondaryButton asChild>
              <Link to="/participants/my-submissions">Open submission records</Link>
            </SecondaryButton>
          </div>
        </div>
      </Container>
    </>
  );
}
