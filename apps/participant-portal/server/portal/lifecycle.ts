export const SUBMISSION_STATUSES = [
  "draft",
  "submitted",
  "terms_accepted",
  "validation",
  "evaluation",
  "eligible",
  "not_eligible",
  "selected",
  "rejected",
  "withdrawn",
  "archived",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<SubmissionStatus, readonly SubmissionStatus[]> = {
  draft: ["submitted"],
  submitted: ["terms_accepted"],
  terms_accepted: ["validation", "withdrawn"],
  validation: ["evaluation", "withdrawn"],
  evaluation: ["eligible", "not_eligible", "withdrawn"],
  eligible: ["selected", "rejected", "withdrawn"],
  not_eligible: ["rejected", "withdrawn"],
  selected: ["archived"],
  rejected: ["archived"],
  withdrawn: ["archived"],
  archived: [],
};

export function canTransition(from: SubmissionStatus, to: SubmissionStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: SubmissionStatus): readonly SubmissionStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

export const ACTIVE_PARTICIPANT_WITHDRAWAL_STATES: readonly SubmissionStatus[] = [
  "terms_accepted",
  "validation",
  "evaluation",
  "eligible",
  "not_eligible",
];
