import { Section } from "@/components/layout/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useFaqs } from "@/hooks/useFaqs";

const SKELETON_IDS = Array.from({ length: 4 }, (_, i) => `faq-skeleton-${i}`);

/** Up to five published FAQs in an accessible, keyboard-operable accordion. */
export function FaqSection() {
  const { data: faqs, isLoading, isError, refetch } = useFaqs(5);
  const visible = (faqs ?? []).slice(0, 5);

  return (
    <Section
      index="05"
      label="FAQ"
      muted
      data-ocid="home.faq_section"
      className="border-b border-border"
    >
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
            Questions, answered.
          </h2>
        </div>

        <div className="md:col-span-8">
          {isLoading ? (
            <div
              data-ocid="home.faq_loading_state"
              className="space-y-4 border-t border-border pt-6"
            >
              {SKELETON_IDS.map((id) => (
                <Skeleton key={id} className="h-12 rounded-sm" />
              ))}
            </div>
          ) : isError ? (
            <div
              data-ocid="home.faq_error_state"
              className="border border-border bg-card p-8"
            >
              <p className="text-sm text-muted-foreground">
                We couldn&rsquo;t load the FAQ right now.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                data-ocid="home.faq_retry_button"
                className="mt-4 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Try again
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div
              data-ocid="home.faq_empty_state"
              className="border border-border bg-card p-8"
            >
              <p className="text-sm text-muted-foreground">
                No questions published yet. Reach out and we&rsquo;ll answer
                directly.
              </p>
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              data-ocid="home.faq_accordion"
              className="border-t border-border"
            >
              {visible.map((faq, i) => (
                <AccordionItem
                  key={String(faq.id)}
                  value={`faq-${faq.id}`}
                  data-ocid={`home.faq.item.${i + 1}`}
                >
                  <AccordionTrigger className="py-5 font-display text-base font-semibold tracking-tight hover:no-underline md:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </Section>
  );
}
