import type { SiteContent, SiteCopy } from "@/types/content";

/**
 * True when a site-copy href points outside the app. Admins may enter a full
 * URL, which must render as a real anchor rather than a client-side route.
 */
export function isAbsoluteUrl(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

/**
 * A stored site-copy value counts as set only when it has visible content.
 * The backend stores whatever string it is given, so an empty or
 * whitespace-only value is treated as "unset" and falls back to the default.
 * This is what makes clearing a field in the admin form genuinely reset it.
 */
function stored(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value.trim() === "" ? undefined : value;
}

/**
 * Resolves editable site copy from the backend, falling back to the Ovanite
 * defaults whenever a field is unset or blank. Components never hardcode site
 * copy.
 */
export function resolveSiteCopy(content: SiteContent | undefined): SiteCopy {
  return {
    heroHeadline: stored(content?.heroHeadline) ?? "Software, built to matter.",
    heroDescription:
      stored(content?.heroDescription) ??
      "Ovanite builds thoughtful digital products designed to solve meaningful problems.",
    primaryCtaLabel: stored(content?.primaryCtaLabel) ?? "Explore products",
    primaryCtaHref: stored(content?.primaryCtaHref) ?? "/products",
    secondaryCtaLabel: stored(content?.secondaryCtaLabel) ?? "About Ovanite",
    secondaryCtaHref: stored(content?.secondaryCtaHref) ?? "/about",
    philosophyTitle: stored(content?.philosophyTitle) ?? "Built with purpose.",
    philosophyBody:
      stored(content?.philosophyBody) ??
      "We start from the problem, not the technology. Every product we build begins with a clear understanding of who it serves and what it must make possible — then we hold it to that standard through every release.",
    approachTitle: stored(content?.approachTitle) ?? "From idea to impact.",
    approachBody:
      stored(content?.approachBody) ??
      "We work in small, focused cycles: define the outcome, build the smallest complete version, measure what changed, and refine. That discipline keeps scope honest and turns early momentum into durable software.",
    aboutTitle:
      stored(content?.aboutTitle) ?? "A software company, not a service.",
    aboutBody:
      stored(content?.aboutBody) ??
      "Ovanite designs and builds its own software products. We are deliberately small, international in outlook, and focused on work that compounds over time rather than chasing short-lived trends.",
    contactTitle:
      stored(content?.contactTitle) ?? "Contact intake is currently closed.",
    contactBody:
      stored(content?.contactBody) ??
      "Contact submissions are currently closed while production persistence and operational controls are being verified. No information is collected through this page.",
    waitlistTitle:
      stored(content?.waitlistTitle) ??
      "Waitlist registration is currently closed.",
    waitlistBody:
      stored(content?.waitlistBody) ??
      "We are preparing the systems for a responsible launch. No registration is active and no details are collected. This page will be updated before registration opens.",
    privacyBody:
      stored(content?.privacyBody) ??
      "Ovanite's contact and waitlist forms are currently disabled; information entered on those pages is not submitted. Page-view analytics is also disabled, and no consent choice is used to record page views. If any of these features are enabled later, this notice will be updated before collection begins to explain the information collected, its purpose, retention, and available choices. The infrastructure delivering and protecting this website may process technical request data under the relevant provider terms.",
    termsBody:
      stored(content?.termsBody) ??
      "This website is provided for general information about Ovanite and its products. Content is offered as-is and may change without notice. Product descriptions do not constitute a binding offer. By using this site you agree to use it lawfully and not to interfere with its operation. These terms are governed by the laws applicable at Ovanite's place of establishment.",
    footerText:
      stored(content?.footerText) ??
      "Ovanite builds software products designed to matter — precise, durable, and made for the long term.",
  };
}
