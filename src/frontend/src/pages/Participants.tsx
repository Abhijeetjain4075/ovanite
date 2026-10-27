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

const principles = [
  [
    "01",
    "Problem first",
    "Start with the problem, the people affected, and the evidence that the software changes something meaningful.",
  ],
  [
    "02",
    "Working software",
    "When intake opens, the program will ask for a real product and evidence so work can be assessed rather than judged on promises.",
  ],
  [
    "03",
    "Structured review",
    "The planned review process uses a versioned rubric and preserves review history for each record once the native portal is available.",
  ],
  [
    "04",
    "Clear decisions",
    "Evaluation and selection are separate records. A score is not a promise of selection, funding, employment, or partnership.",
  ],
] as const;

export default function Participants() {
  return (
    <>
      <PageMeta
        title="Participant Platform Overview"
        description="Learn about Ovanite’s planned software-submission review process. Submission intake is not open yet."
      />
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Participants" }]}
      />

      <Container className="py-16 md:py-24">
        <div className="grid gap-12 border-t border-border pt-5 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
                01
              </span>
              <span className="eyebrow">Ovanite Participant Platform</span>
            </div>
            <h1 className="mt-7 max-w-4xl text-balance font-display text-5xl font-bold tracking-tight md:text-7xl">
              Put the work in front of a serious review.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Ovanite is preparing a structured process for reviewing real
              software. Submission intake is not open yet; this page explains
              the intended review stages, not a live submission system.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryButton
                size="lg"
                disabled
                aria-describedby="participants-access-status"
              >
                Submission intake is not open
              </PrimaryButton>
              <SecondaryButton asChild size="lg">
                <a
                  href="#submission-lifecycle"
                  data-ocid="participants.review_process_button"
                >
                  View review stages
                </a>
              </SecondaryButton>
            </div>
            <p
              id="participants-access-status"
              className="mt-4 max-w-xl text-xs leading-relaxed text-muted-foreground"
            >
              This is an overview only. Submission, login, saved drafts, and
              review-history features are not active on this page.
            </p>
          </div>

          <SurfaceCard
            id="submission-lifecycle"
            className="lg:col-span-5 p-6 md:p-8"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="eyebrow">Submission lifecycle</span>
              <MicroBadge>Planned lifecycle</MicroBadge>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              These are intended stages, not live statuses in a production
              submission record.
            </p>
            <div className="mt-6 space-y-4 font-mono text-xs">
              {[
                "DRAFT",
                "SUBMITTED",
                "VALIDATION",
                "EVALUATION",
                "ELIGIBLE / NOT ELIGIBLE",
                "SELECTED / REJECTED",
              ].map((state, index) => (
                <div key={state} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border text-[10px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={
                      index === 0 ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {state}
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        <div className="mt-20 grid gap-0 border-y border-border md:grid-cols-2">
          {principles.map(([number, title, body]) => (
            <article
              key={number}
              className="border-b border-border p-6 last:border-b-0 md:p-8 md:odd:border-r md:[&:nth-last-child(-n+2)]:border-b-0"
            >
              <p className="font-mono text-xs tracking-[0.2em] text-primary">
                {number}
              </p>
              <h2 className="mt-4 font-display text-2xl font-semibold">
                {title}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-16 border border-border bg-muted/30 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Want to participate?</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                Intake opens after the native portal is ready.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ovanite will open submissions only after identity, data
                isolation, reviewer permissions, and lifecycle controls have
                been implemented and verified.
              </p>
            </div>
            <SecondaryButton asChild>
              <Link to="/contact">Contact Ovanite</Link>
            </SecondaryButton>
          </div>
        </div>
      </Container>
    </>
  );
}
