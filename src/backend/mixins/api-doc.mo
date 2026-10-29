/// Static API documentation for the Ovanite backend.
/// Keep this contract aligned with the server-enforced policy in the Motoko source.
mixin () {
  public query func getApiDoc() : async Text {
    "# Ovanite Backend API\n" #
    "\n" #
    "## Purpose and deployment boundary\n" #
    "\n" #
    "This Motoko canister is the data layer for Ovanite's public website: published product and FAQ content, editable site copy, owner/admin authorization, and the Contact/Waitlist submission model. The React/Vite frontend is hosted separately. A successful frontend build or local canister test does not establish that a production canister exists or is reachable.\n" #
    "\n" #
    "## Security model\n" #
    "\n" #
    "The `admins` map is the authority for Ovanite's content, submission, and team-management methods. The generic access-control mixin's `#admin/#user/#guest` roles are a separate role system: a generic access-control admin does not automatically become an Ovanite admin. Each protected canister method checks its caller on the backend; hiding a UI control is not authorization.\n" #
    "\n" #
    "### Owner bootstrap\n" #
    "\n" #
    "Owner bootstrap is fail-closed. In the current source, `ownerPrincipal` is `null`, so `claimOwner(email)` is deliberately unavailable and `isOwnerClaimed()` returns `true`. Before bootstrap can be enabled, the source must be configured with the exact verified principal derived from Ovanite's final Internet Identity origin. A claim additionally requires a non-anonymous caller, an empty admin map, and the configured owner email as a secondary consistency check. Email alone, a Caffeine project UUID, or a principal from a different origin is never sufficient to grant ownership.\n" #
    "\n" #
    "### Ovanite admin roles\n" #
    "\n" #
    "| Role | Protected reads | Content/submission writes | Admin-team changes |\n" #
    "| --- | --- | --- | --- |\n" #
    "| `#owner` | Yes | Yes | Yes |\n" #
    "| `#editor` | Yes | Yes | No |\n" #
    "| `#viewer` | Yes | No | No |\n" #
    "| Unregistered caller | No | No | No |\n" #
    "\n" #
    "The owner is unique. `addAdmin(principal, #owner)` is rejected and `setAdminRole(principal, #owner)` returns `null`; the owner's role cannot be changed and the owner cannot be removed. Only the owner may add, remove, or re-role other admins.\n" #
    "\n" #
    "## Public reads\n" #
    "\n" #
    "| Method | Behavior |\n" #
    "| --- | --- |\n" #
    "| `listPublishedProducts()` | Published products ordered by `sortOrder`, then ID. Product records are capped by the backend at 100. |\n" #
    "| `listPublishedFaqs(limit)` | Published FAQs ordered by `sortOrder`, then ID; the requested limit is capped at 20 before slicing. |\n" #
    "| `getSiteContent()` | Editable site-copy record. |\n" #
    "| `getCallerAdmin()` | The caller's admin record, or `null`. |\n" #
    "| `isCallerOwner()` | Whether the caller is the configured owner recorded in the admin map. |\n" #
    "| `isOwnerClaimed()` | Whether an owner exists or bootstrap is unconfigured. |\n" #
    "| `getPageViews(path)`, `listPageViews()` | Public aggregate analytics reads. |\n" #
    "| `getApiDoc()` | This API and release-policy document. |\n" #
    "\n" #
    "## Protected reads\n" #
    "\n" #
    "Every method below requires a registered Ovanite admin. Viewers, editors, and the owner may read; unregistered callers are rejected.\n" #
    "\n" #
    "| Method | Behavior |\n" #
    "| --- | --- |\n" #
    "| `listAllProducts()`, `getProduct(id)` | Read all products or one product, including drafts. |\n" #
    "| `listAllFaqs()`, `getFaq(id)` | Read all FAQs or one FAQ, including drafts. |\n" #
    "| `listSubmissions(filter)`, `getSubmission(id)` | Read Contact/Waitlist records and their review status. |\n" #
    "| `listAdmins()` | Read the Ovanite admin roster. |\n" #
    "\n" #
    "## Protected writes\n" #
    "\n" #
    "Content and submission mutations require `#owner` or `#editor`. A `#viewer` request traps with `Unauthorized: editor or owner access required`.\n" #
    "\n" #
    "- Content: `createProduct`, `updateProduct`, `setProductState`, `deleteProduct`, `createFaq`, `updateFaq`, `setFaqState`, `deleteFaq`, and `updateSiteContent`. New products and FAQs begin as drafts.\n" #
    "- Submissions: `setSubmissionStatus` and `deleteSubmission`. These require an editor or owner even though public submission intake is currently disabled.\n" #
    "- Admin team: `addAdmin`, `setAdminRole`, and `removeAdmin` require the owner; attempts to assign the reserved owner role are rejected.\n" #
    "\n" #
    "## Public write release gates\n" #
    "\n" #
    "- `submitContact(input)` and `submitWaitlist(input)` currently trap with `Public submissions are disabled by backend release policy`. The Motoko source sets `publicSubmissionWritesEnabled = false`; a frontend flag cannot override this policy.\n" #
    "- `recordPageView(path)` currently traps with `Public analytics writes are disabled by backend release policy`. The source sets `publicAnalyticsWritesEnabled = false` because public calls need bounded route cardinality and effective abuse/cost controls.\n" #
    "- Do not turn either gate on until persistence, input validation, anti-abuse/rate controls, privacy/retention, operational response, and direct-canister end-to-end tests are verified.\n" #
    "\n" #
    "When public submissions are deliberately enabled in a reviewed release, the backend validates names, email lengths, messages/notes, and duplicate submissions. Duplicate receipts are redacted and do not disclose the existing person's name, email, or message. These guarantees do not make the currently disabled intake operational.\n" #
    "\n" #
    "## Input and state bounds\n" #
    "\n" #
    "- At most 100 products and 100 FAQs may be stored through the content API.\n" #
    "- Product name: 120 characters; description: 5000; product link and image URL: 2048 each. Product links and image URLs must use HTTPS, include a host, and must not contain embedded credentials or whitespace.\n" #
    "- FAQ question: 300 characters; answer: 10000. Each editable site-copy field is capped at 10000 characters.\n" #
    "- Public FAQ queries return at most 20 records even if a caller supplies an extremely large `Nat` limit.\n" #
    "\n" #
    "## OQL data surface\n" #
    "\n" #
    "The canister exposes `schema()` and `execute(qJson)` through OQL. Product, FAQ, and site-content entities are public-read; submission and admin entities are controller-only. Controller-only does not mean ordinary application admins can query those entities; use the protected canister methods for admin data.\n" #
    "\n" #
    "## Independent-storage limitation\n" #
    "\n" #
    "The exported backend retains the Caffeine object-storage adapter for legacy blob compatibility. Its gateway compatibility and upload/read/delete behavior have not been proven for an independently deployed canister. Do not enable blob uploads or configure a guessed storage gateway. The optional HTTPS `imageUrl` path is separate from the legacy `imageKey` blob reference.\n" #
    "\n" #
    "## Production status\n" #
    "\n" #
    "This source is designed to build and test independently, but no production mainnet canister is asserted by this document. A mainnet deployment requires a reviewed identity configuration, a real canister ID, a verified deployed Candid interface, compatible storage, approved cycle funding, and production end-to-end checks. Until those gates pass, keep owner bootstrap, public submissions, public analytics writes, and participant intake closed.\n";
  };
};
