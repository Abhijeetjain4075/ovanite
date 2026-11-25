import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { useSiteContent } from "@/hooks/useSiteContent";
import { isIntakeOpen } from "@/lib/intake";
import { resolveSiteCopy } from "@/lib/siteCopy";

/**
 * Collection notice for the three live intake surfaces. It is rendered only when
 * this deployment has a configured intake service, so the policy never describes
 * collection that is not happening.
 */
const INTAKE_PRIVACY_PARAGRAPHS = [
  "Participant submissions, contact messages and waitlist registrations are stored so Ovanite can review them and reply. A record contains only what you type into the form: your name, your email address, and the details you choose to provide.",
  "Submissions are kept while they are under review and for up to 12 months afterwards, then deleted. They are not sold, shared for advertising, or used to profile you. You can ask for a submission to be deleted at any time through the contact page.",
  "The submission service stores a salted digest of your network address instead of the address itself, and uses it only to limit abusive traffic. The service provider that delivers and protects this website processes technical request data under its own terms.",
];

/**
 * Split a policy body into paragraphs on blank lines, dropping empty entries so
 * stray whitespace never renders an empty `<p>`. Keys are the paragraph text
 * itself, which is stable across refetches and unique within a policy.
 */
function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export default function Privacy() {
  const { data } = useSiteContent();
  const copy = resolveSiteCopy(data);
  const paragraphs = [
    ...toParagraphs(copy.privacyBody),
    ...(isIntakeOpen() ? INTAKE_PRIVACY_PARAGRAPHS : []),
  ];

  return (
    <>
      <PageMeta
        title="Privacy"
        description="Current Ovanite contact, waitlist, and analytics collection status and the conditions before these features are enabled."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Privacy" }]} />

      <Container className="py-16 md:py-24">
        <div className="flex items-baseline gap-3 border-t border-border pt-4">
          <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
            01
          </span>
          <span className="eyebrow">Legal</span>
        </div>

        <div className="mt-10 min-w-0 max-w-3xl">
          <h1 className="text-balance break-words font-display text-4xl font-bold tracking-tight md:text-5xl">
            Privacy Policy
          </h1>
          <div className="mt-8 space-y-5 text-pretty break-words text-lg leading-relaxed text-muted-foreground">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
