import type {
  Admin,
  Faq,
  FaqInput,
  FaqPatch,
  Product,
  ProductInput,
  ProductPatch,
  SiteContent,
  Submission,
  SubmissionFilter,
} from "@/backend";

export type {
  Admin,
  Faq,
  FaqInput,
  FaqPatch,
  Product,
  ProductInput,
  ProductPatch,
  SiteContent,
  Submission,
  SubmissionFilter,
};

export type { PublishState, SubmissionKind, SubmissionStatus } from "@/backend";

// `AdminRole` is a value enum: re-export it as a value so consumers can use
// `AdminRole.editor` in comparisons and select options.
export { AdminRole } from "@/backend";

/** A resolved site-copy field: backend value when present, fallback otherwise. */
export type SiteCopy = {
  heroHeadline: string;
  heroDescription: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  philosophyTitle: string;
  philosophyBody: string;
  approachTitle: string;
  approachBody: string;
  aboutTitle: string;
  aboutBody: string;
  contactTitle: string;
  contactBody: string;
  waitlistTitle: string;
  waitlistBody: string;
  privacyBody: string;
  termsBody: string;
  footerText: string;
};

/** Route metadata used by PageMeta and Breadcrumbs. */
export type RouteMeta = {
  title: string;
  description: string;
  path: string;
  label: string;
  parent?: { label: string; path: string };
};
