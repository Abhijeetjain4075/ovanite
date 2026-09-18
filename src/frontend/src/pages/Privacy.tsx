import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { useSiteContent } from "@/hooks/useSiteContent";
import { resolveSiteCopy } from "@/lib/siteCopy";

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
  const paragraphs = toParagraphs(copy.privacyBody);

  return (
    <>
      <PageMeta
        title="Privacy"
        description="How Ovanite handles the information you share through our contact and waitlist forms."
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
