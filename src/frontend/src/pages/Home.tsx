import { AboutPreview } from "@/components/home/AboutPreview";
import { ApproachSection } from "@/components/home/ApproachSection";
import { ContactCta } from "@/components/home/ContactCta";
import { FaqSection } from "@/components/home/FaqSection";
import { Hero } from "@/components/home/Hero";
import { PhilosophySection } from "@/components/home/PhilosophySection";
import { ProductsPreview } from "@/components/home/ProductsPreview";
import { PageMeta } from "@/components/layout/PageMeta";
import { useSiteContent } from "@/hooks/useSiteContent";
import { resolveSiteCopy } from "@/lib/siteCopy";

export default function Home() {
  const { data } = useSiteContent();
  const copy = resolveSiteCopy(data);

  return (
    <>
      <PageMeta
        title="Software, built to matter"
        description="Ovanite is a software company building products designed to matter — precise, durable, and made for the long term."
      />
      <Hero copy={copy} />
      <PhilosophySection copy={copy} />
      <ProductsPreview />
      <ApproachSection copy={copy} />
      <AboutPreview copy={copy} />
      <FaqSection />
      <ContactCta />
    </>
  );
}
