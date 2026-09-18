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
    contactTitle: stored(content?.contactTitle) ?? "Start a conversation.",
    contactBody:
      stored(content?.contactBody) ??
      "Tell us what you are working on and what a good outcome looks like. We read every message and reply to the ones where we can genuinely help.",
    waitlistTitle: stored(content?.waitlistTitle) ?? "Join the waitlist.",
    waitlistBody:
      stored(content?.waitlistBody) ??
      "Be the first to know when our products launch. We will only email you when there is something real to share.",
    privacyBody:
      stored(content?.privacyBody) ??
      'Ovanite collects only the information you choose to share through our contact and waitlist forms — your name, email address, and any message or note you provide. We use it solely to respond to you and to share product updates you asked for. We do not sell your data, and we do not share it with third parties for marketing. You can ask us to delete your information at any time by contacting us.\n\nWe also count page views so we can understand which parts of the site are useful. This counting happens in our own backend, and it is aggregate only: we store a route path and a running view count for that path. We do not use cookies for this, and we do not store personal identifiers, IP addresses, or user agents. No third-party analytics service is involved, and no individual visitor can be identified from what we keep.\n\nPage-view counting only happens after you accept the consent banner shown on your first visit. If you decline, nothing is counted. Your choice is remembered locally in your browser, so we do not ask again on every visit.\n\nYou can change or withdraw your consent at any time using the "Cookie preferences" link in the footer. Withdrawing consent stops any further counting; it does not delete the aggregate counts already recorded, which contain no information about you.',
    termsBody:
      stored(content?.termsBody) ??
      "This website is provided for general information about Ovanite and its products. Content is offered as-is and may change without notice. Product descriptions do not constitute a binding offer. By using this site you agree to use it lawfully and not to interfere with its operation. These terms are governed by the laws applicable at Ovanite's place of establishment.",
    footerText:
      stored(content?.footerText) ??
      "Ovanite builds software products designed to matter — precise, durable, and made for the long term.",
  };
}
