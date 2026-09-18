import { WaitlistForm } from "@/components/forms/WaitlistForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { useSiteContent } from "@/hooks/useSiteContent";
import { resolveSiteCopy } from "@/lib/siteCopy";

export default function Waitlist() {
  const { data } = useSiteContent();
  const copy = resolveSiteCopy(data);

  return (
    <>
      <PageMeta
        title="Waitlist"
        description="Join the Ovanite waitlist to be the first to know when our software products launch."
      />
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Waitlist" }]}
      />

      <Container className="py-16 md:py-24">
        <div className="flex items-baseline gap-3 border-t border-border pt-4">
          <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
            01
          </span>
          <span className="eyebrow">Waitlist</span>
        </div>

        <div className="mt-10 grid gap-14 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <h1 className="text-balance font-display text-4xl font-bold tracking-tight md:text-5xl">
              {copy.waitlistTitle}
            </h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              {copy.waitlistBody}
            </p>
          </div>

          <div className="md:col-span-7">
            <div className="border border-border bg-card">
              <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 md:px-10">
                <span className="eyebrow">Early access</span>
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
                  No noise, launch updates only
                </span>
              </div>
              <div className="p-6 md:p-10">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
