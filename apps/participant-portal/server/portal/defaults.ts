import type { SubmissionCategory } from "./validation";

export const SUBMISSION_CATEGORIES: SubmissionCategory[] = [
  "Developer tools",
  "Education",
  "Climate & energy",
  "Health & care",
  "Finance & commerce",
  "Public interest",
  "Creative tools",
  "Other",
];

export const DEFAULT_RUBRIC = [
  { id: "problem-clarity", label: "Problem clarity", description: "Is the problem specific, evidenced, and worth solving?", weight: 14 },
  { id: "product-completeness", label: "Product completeness", description: "How coherent and usable is the delivered product?", weight: 14 },
  { id: "usability", label: "Usability", description: "Can the intended user understand and complete core tasks?", weight: 12 },
  { id: "technical-quality", label: "Technical quality", description: "Are the architecture and implementation appropriate to the problem?", weight: 14 },
  { id: "originality", label: "Originality", description: "Does the work offer a considered, differentiated approach?", weight: 12 },
  { id: "documentation", label: "Documentation", description: "Can a reviewer understand setup, decisions, and limitations?", weight: 10 },
  { id: "reliability-security", label: "Reliability & security", description: "Are reliability, privacy, and security risks addressed?", weight: 14 },
  { id: "evidence-quality", label: "Evidence quality", description: "Do the submitted links and materials substantiate the claims?", weight: 10 },
];

export const INITIAL_TERMS_PLACEHOLDER = `CONFIGURABLE PROGRAM TERMS — PLACEHOLDER\n\nThis text is a configuration placeholder, not approved legal language. Replace it with Ovanite's approved program terms before publishing.\n\nSubmitting a project authorizes Ovanite to review the materials under the published program rules. A submission does not itself guarantee selection, funding, employment, partnership, publication, or any other outcome.\n\nThe participant confirms that they own or have the rights needed to submit the materials and that they know of no third-party rights violation in the submitted materials.\n\nOvanite's published program rules and declarations will be versioned. The exact version accepted at submission and its timestamp will be retained with the submission record.`;
