function isAbsoluteUrl(href) {
  return /^https?:\/\//i.test(href.trim());
}
function stored(value) {
  if (value === void 0) return void 0;
  return value.trim() === "" ? void 0 : value;
}
function resolveSiteCopy(content) {
  return {
    heroHeadline: stored(content == null ? void 0 : content.heroHeadline) ?? "Software, built to matter.",
    heroDescription: stored(content == null ? void 0 : content.heroDescription) ?? "Ovanite builds thoughtful digital products designed to solve meaningful problems.",
    primaryCtaLabel: stored(content == null ? void 0 : content.primaryCtaLabel) ?? "Explore products",
    primaryCtaHref: stored(content == null ? void 0 : content.primaryCtaHref) ?? "/products",
    secondaryCtaLabel: stored(content == null ? void 0 : content.secondaryCtaLabel) ?? "About Ovanite",
    secondaryCtaHref: stored(content == null ? void 0 : content.secondaryCtaHref) ?? "/about",
    philosophyTitle: stored(content == null ? void 0 : content.philosophyTitle) ?? "Built with purpose.",
    philosophyBody: stored(content == null ? void 0 : content.philosophyBody) ?? "We start from the problem, not the technology. Every product we build begins with a clear understanding of who it serves and what it must make possible — then we hold it to that standard through every release.",
    approachTitle: stored(content == null ? void 0 : content.approachTitle) ?? "From idea to impact.",
    approachBody: stored(content == null ? void 0 : content.approachBody) ?? "We work in small, focused cycles: define the outcome, build the smallest complete version, measure what changed, and refine. That discipline keeps scope honest and turns early momentum into durable software.",
    aboutTitle: stored(content == null ? void 0 : content.aboutTitle) ?? "A software company, not a service.",
    aboutBody: stored(content == null ? void 0 : content.aboutBody) ?? "Ovanite designs and builds its own software products. We are deliberately small, international in outlook, and focused on work that compounds over time rather than chasing short-lived trends.",
    contactTitle: stored(content == null ? void 0 : content.contactTitle) ?? "Start a conversation.",
    contactBody: stored(content == null ? void 0 : content.contactBody) ?? "Tell us what you are working on and what a good outcome looks like. We read every message and reply to the ones where we can genuinely help.",
    waitlistTitle: stored(content == null ? void 0 : content.waitlistTitle) ?? "Join the waitlist.",
    waitlistBody: stored(content == null ? void 0 : content.waitlistBody) ?? "Be the first to know when our products launch. We will only email you when there is something real to share.",
    privacyBody: stored(content == null ? void 0 : content.privacyBody) ?? 'Ovanite collects only the information you choose to share through our contact and waitlist forms — your name, email address, and any message or note you provide. We use it solely to respond to you and to share product updates you asked for. We do not sell your data, and we do not share it with third parties for marketing. You can ask us to delete your information at any time by contacting us.\n\nWe also count page views so we can understand which parts of the site are useful. This counting happens in our own backend, and it is aggregate only: we store a route path and a running view count for that path. We do not use cookies for this, and we do not store personal identifiers, IP addresses, or user agents. No third-party analytics service is involved, and no individual visitor can be identified from what we keep.\n\nPage-view counting only happens after you accept the consent banner shown on your first visit. If you decline, nothing is counted. Your choice is remembered locally in your browser, so we do not ask again on every visit.\n\nYou can change or withdraw your consent at any time using the "Cookie preferences" link in the footer. Withdrawing consent stops any further counting; it does not delete the aggregate counts already recorded, which contain no information about you.',
    termsBody: stored(content == null ? void 0 : content.termsBody) ?? "This website is provided for general information about Ovanite and its products. Content is offered as-is and may change without notice. Product descriptions do not constitute a binding offer. By using this site you agree to use it lawfully and not to interfere with its operation. These terms are governed by the laws applicable at Ovanite's place of establishment.",
    footerText: stored(content == null ? void 0 : content.footerText) ?? "Ovanite builds software products designed to matter — precise, durable, and made for the long term."
  };
}
export {
  isAbsoluteUrl as i,
  resolveSiteCopy as r
};
