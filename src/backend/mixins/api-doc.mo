/// Static API documentation for the Ovanite backend.
///
/// This mixin contributes exactly one public method, `getApiDoc`, and reads no
/// actor state. The Markdown is authored from the current backend source and
/// must be kept in sync whenever public API behaviour changes.
mixin () {
  /// Returns the backend's public API documentation as Markdown.
  public query func getApiDoc() : async Text {
    "# Ovanite Backend API\n" #
    "\n" #
    "## Purpose\n" #
    "\n" #
    "The Ovanite backend is the data layer for the Ovanite marketing website. It stores\n" #
    "the editable site copy, the product catalogue, the FAQ list, and inbound Contact and\n" #
    "Waitlist submissions. It also exposes an admin surface for managing that content and\n" #
    "an OQL (Object Query Layer) surface for natural-language data intelligence queries.\n" #
    "\n" #
    "## Authentication and identity\n" #
    "\n" #
    "Most read endpoints are public and callable by anyone, including anonymous callers.\n" #
    "All admin endpoints require a signed (non-anonymous) caller whose principal is a\n" #
    "registered admin. The backend never trusts client-side checks: every admin endpoint\n" #
    "re-verifies the caller on the canister.\n" #
    "\n" #
    "The app's frontend pins an Internet Identity derivation origin, published at\n" #
    "`/.well-known/ii-derivation-origin` when available. An agent that already holds the\n" #
    "user's Internet Identity authorization derives the correct per-app principal against\n" #
    "that origin (for example `icp identity link web <name> --app <host>`). Such a\n" #
    "delegation acts with the user's full authority in this app until it expires.\n" #
    "\n" #
    "### Registration prerequisite\n" #
    "\n" #
    "A caller can be signed in and still be unregistered. Registration happens only when a\n" #
    "caller signs in through the app's own frontend, which calls `_initialize_access_control`\n" #
    "once. A direct API caller must therefore call `_initialize_access_control` once as a\n" #
    "signed-in caller before any role-guarded call, including guarded queries.\n" #
    "\n" #
    "- The first non-anonymous caller to initialize becomes `#admin`.\n" #
    "- Every subsequent non-anonymous caller becomes `#user`.\n" #
    "- An anonymous caller is ignored by initialization and remains `#guest`.\n" #
    "\n" #
    "A principal that never signed in through the app's frontend is unregistered even when\n" #
    "it belongs to the app's owner, and a signed-in caller derived against a different\n" #
    "origin is a different principal than the one the frontend registered.\n" #
    "\n" #
    "### Owner bootstrap\n" #
    "\n" #
    "The backend cannot read an email from Internet Identity, so ownership is bootstrapped\n" #
    "by a one-time claim. `claimOwner(email)` succeeds only when **all** of the following\n" #
    "hold:\n" #
    "\n" #
    "- the caller is signed in (not anonymous);\n" #
    "- the `admins` map is still empty (no owner has claimed yet);\n" #
    "- `email` exactly matches the configured owner email.\n" #
    "\n" #
    "The first successful claim records the caller as the owner with role `#owner`. Once an\n" #
    "owner exists the claim path is closed permanently: `claimOwner` returns `false` for\n" #
    "every later caller, so no user can self-grant admin access after the owner exists.\n" #
    "`isOwnerClaimed()` reports whether the owner has been claimed yet.\n" #
    "\n" #
    "### Authorization boundaries\n" #
    "\n" #
    "- `getCallerUserRole()` returns `#guest` for anonymous callers and traps with\n" #
    "  `User is not registered` for a signed-in but unregistered caller.\n" #
    "- `isCallerAdmin()` returns whether the caller holds the `#admin` role; it traps for\n" #
    "  an unregistered signed-in caller.\n" #
    "- `assignCallerUserRole(user, role)` traps with\n" #
    "  `Unauthorized: Only admins can assign user roles` unless the caller is an admin.\n" #
    "- Admin content and submission endpoints trap with\n" #
    "  `Unauthorized: admin access required` unless the caller is a registered admin.\n" #
    "- `addAdmin`, `setAdminRole`, and `removeAdmin` trap with\n" #
    "  `Unauthorized: owner access required` unless the caller is the owner.\n" #
    "- `claimOwner` traps with `Unauthorized: signed-in caller required` for an anonymous\n" #
    "  caller and `Unauthorized: email is not the configured owner` for a wrong email.\n" #
    "\n" #
    "Note that the admin role used by the content and submission endpoints is the\n" #
    "`admins` map, which is separate from the access-control role. A caller must be present\n" #
    "in the `admins` map to manage content or read submissions.\n" #
    "\n" #
    "### Admin roles\n" #
    "\n" #
    "Each record in the `admins` map carries a `role`:\n" #
    "\n" #
    "- `#owner` — the single owner. May add, remove, and re-role admins.\n" #
    "- `#editor` — may manage content and submissions.\n" #
    "- `#viewer` — read-only access to the admin surface.\n" #
    "\n" #
    "The owner's own role cannot be changed and the owner cannot be removed.\n" #
    "\n" #
    "## Public reads\n" #
    "\n" #
    "| Method | Caller | Returns |\n" #
    "| --- | --- | --- |\n" #
    "| `listPublishedProducts()` | anyone | Published products, ordered by `sortOrder` then `id`. |\n" #
    "| `listPublishedFaqs(limit)` | anyone | Up to `limit` published FAQs, ordered by `sortOrder` then `id`. |\n" #
    "| `getSiteContent()` | anyone | The editable site copy record. |\n" #
    "| `getCallerAdmin()` | anyone | The caller's admin record, or `null` when not an admin. |\n" #
    "| `isCallerOwner()` | anyone | Whether the caller is the owner. |\n" #
    "| `isOwnerClaimed()` | anyone | Whether the owner has been claimed yet. |\n" #
    "| `getCallerUserRole()` | signed-in | The caller's access-control role. |\n" #
    "| `isCallerAdmin()` | signed-in | Whether the caller holds the `#admin` access-control role. |\n" #
    "\n" #
    "## Public writes\n" #
    "\n" #
    "| Method | Caller | Returns |\n" #
    "| --- | --- | --- |\n" #
    "| `submitContact(input)` | anyone | `SubmitResult`: `#created` with the stored Contact submission, or `#duplicate` with the existing one. |\n" #
    "| `submitWaitlist(input)` | anyone | `SubmitResult`: `#created` with the stored Waitlist submission, or `#duplicate` with the existing one. |\n" #
    "| `claimOwner(email)` | signed-in | One-time ownership claim; `false` once an owner exists. |\n" #
    "\n" #
    "## Admin reads\n" #
    "\n" #
    "All of the following require a registered admin and trap otherwise.\n" #
    "\n" #
    "| Method | Returns |\n" #
    "| --- | --- |\n" #
    "| `listAllProducts()` | Every product, published or not. |\n" #
    "| `getProduct(id)` | A single product, or `null`. |\n" #
    "| `listAllFaqs()` | Every FAQ, published or not. |\n" #
    "| `getFaq(id)` | A single FAQ, or `null`. |\n" #
    "| `listSubmissions(filter)` | Submissions matching `filter`, newest first. |\n" #
    "| `getSubmission(id)` | A single submission, or `null`. |\n" #
    "| `listAdmins()` | Every admin, owner first then by `addedAt`. |\n" #
    "\n" #
    "## Admin writes\n" #
    "\n" #
    "All of the following require a registered admin and trap otherwise.\n" #
    "\n" #
    "| Method | Returns |\n" #
    "| --- | --- |\n" #
    "| `createProduct(input)` | The created product, as `#draft`. |\n" #
    "| `updateProduct(id, patch)` | The updated product, or `null` when absent. |\n" #
    "| `setProductState(id, state)` | The updated product, or `null` when absent. |\n" #
    "| `deleteProduct(id)` | Whether a product was removed. |\n" #
    "| `createFaq(input)` | The created FAQ, as `#draft`. |\n" #
    "| `updateFaq(id, patch)` | The updated FAQ, or `null` when absent. |\n" #
    "| `setFaqState(id, state)` | The updated FAQ, or `null` when absent. |\n" #
    "| `deleteFaq(id)` | Whether an FAQ was removed. |\n" #
    "| `updateSiteContent(patch)` | The merged site copy. |\n" #
    "| `setSubmissionStatus(id, status)` | The updated submission, or `null` when absent. |\n" #
    "| `deleteSubmission(id)` | Whether a submission was removed. |\n" #
    "\n" #
    "## Owner writes\n" #
    "\n" #
    "All of the following require the owner and trap with\n" #
    "`Unauthorized: owner access required` otherwise.\n" #
    "\n" #
    "| Method | Returns |\n" #
    "| --- | --- |\n" #
    "| `addAdmin(principal, role)` | `false` when already an admin, otherwise `true`. |\n" #
    "| `setAdminRole(principal, role)` | The updated admin, or `null` when absent or the owner. |\n" #
    "| `removeAdmin(principal)` | Whether an admin was removed; the owner cannot be removed. |\n" #
    "\n" #
    "## Duplicate submissions\n" #
    "\n" #
    "`submitContact` and `submitWaitlist` both return a `SubmitResult`:\n" #
    "\n" #
    "- `#created(submission)` — a new record was stored.\n" #
    "- `#duplicate(submission)` — an equivalent record already existed; nothing was stored.\n" #
    "\n" #
    "A duplicate is detected per kind (`#contact` vs `#waitlist`) by comparing the\n" #
    "normalized email **and** the normalized message/note:\n" #
    "\n" #
    "- Email normalization is conservative and deterministic: surrounding whitespace is\n" #
    "  trimmed and the value is case-folded. `\" Ada@Example.com \"` and `\"ada@example.com\"`\n" #
    "  are the same email.\n" #
    "- Message/note normalization trims surrounding whitespace only; case is preserved\n" #
    "  because message content is meaningful. An absent or empty note normalizes to the\n" #
    "  same value, which is distinct from any non-empty note.\n" #
    "- A different message/note, or a different email, is never treated as a duplicate.\n" #
    "\n" #
    "The frontend should branch on the variant: render an \"Already received\" message for\n" #
    "`#duplicate` and a success state for `#created`. Both arms carry the full submission\n" #
    "record, so the existing record's `id` and `createdAt` are available for display.\n" #
    "\n" #
    "## Units and encodings\n" #
    "\n" #
    "- `Id` is a `Nat` assigned by the backend, starting at 1 and monotonically increasing.\n" #
    "- `Timestamp` is a `Nat` in nanoseconds since the Unix epoch (`Time.now()`).\n" #
    "- `PublishState` is the variant `#draft` or `#published`.\n" #
    "- `SubmissionKind` is the variant `#contact` or `#waitlist`.\n" #
    "- `SubmissionStatus` is the variant `#new`, `#read`, or `#handled`.\n" #
    "- `SubmitResult` is the variant `#created : Submission` or `#duplicate : Submission`.\n" #
    "- `AdminRole` is the variant `#owner`, `#editor`, or `#viewer`.\n" #
    "- Optional fields (`?Text`) are `null` when unset. In patch inputs, `null` means\n" #
    "  \"leave the stored value untouched\"; it does not clear the field.\n" #
    "- `SiteContent` fields are all optional so the frontend can fall back to its own\n" #
    "  defaults until an admin saves a value.\n" #
    "\n" #
    "## Lifecycle and polling\n" #
    "\n" #
    "There is no asynchronous job or long-running process in this backend. Every call\n" #
    "completes within its own message, so no polling is required. A client that wants to\n" #
    "observe a change simply re-reads the relevant query endpoint.\n" #
    "\n" #
    "## Mutation retry safety\n" #
    "\n" #
    "- `submitContact` and `submitWaitlist` are **not idempotent** in the sense that a\n" #
    "  successful call appends a new submission with a fresh id. They do, however, reject\n" #
    "  exact duplicates: a submission whose normalized email and normalized message/note\n" #
    "  match an existing record of the same kind is not stored again, and the call returns\n" #
    "  `#duplicate` carrying the existing record. Retrying a call that already succeeded\n" #
    "  therefore returns `#duplicate` rather than creating a second record.\n" #
    "- `createProduct` and `createFaq` are likewise not idempotent; each call creates a new\n" #
    "  record with a fresh id.\n" #
    "- `updateProduct`, `updateFaq`, `setProductState`, `setFaqState`, `updateSiteContent`,\n" #
    "  and `setSubmissionStatus` are idempotent: applying the same patch or state twice\n" #
    "  yields the same stored value (only `updatedAt` advances).\n" #
    "- `deleteProduct`, `deleteFaq`, and `deleteSubmission` are idempotent in effect: a\n" #
    "  second call returns `false` because the record is already gone.\n" #
    "- `addAdmin` is idempotent in effect: a second call returns `false`.\n" #
    "- `setAdminRole` is idempotent: applying the same role twice yields the same record.\n" #
    "- `removeAdmin` is idempotent in effect: a second call returns `false`.\n" #
    "- `claimOwner` is idempotent in effect: only the first successful call records an\n" #
    "  owner; every later call returns `false`.\n" #
    "\n" #
    "## Errors, traps, and limits\n" #
    "\n" #
    "- Admin-guarded endpoints trap with `Unauthorized: admin access required` for a\n" #
    "  non-admin caller.\n" #
    "- `getCallerUserRole()` and `isCallerAdmin()` trap with `User is not registered` for a\n" #
    "  signed-in caller that never initialized access control.\n" #
    "- `assignCallerUserRole` traps with `Unauthorized: Only admins can assign user roles`\n" #
    "  for a non-admin caller.\n" #
    "- `addAdmin`, `setAdminRole`, and `removeAdmin` trap with\n" #
    "  `Unauthorized: owner access required` for a non-owner caller.\n" #
    "- `claimOwner` traps with `Unauthorized: signed-in caller required` for an anonymous\n" #
    "  caller and `Unauthorized: email is not the configured owner` for a wrong email; it\n" #
    "  returns `false` (without trapping) once an owner already exists.\n" #
    "- `removeAdmin` returns `false` rather than trapping when asked to remove the owner.\n" #
    "- `setAdminRole` returns `null` rather than trapping when asked to re-role the owner.\n" #
    "- `getProduct`, `getFaq`, `getSubmission`, `updateProduct`, `updateFaq`,\n" #
    "  `setProductState`, `setFaqState`, and `setSubmissionStatus` return `null` for an\n" #
    "  unknown id; they do not trap.\n" #
    "- `listPublishedFaqs(limit)` returns at most `limit` rows; pass a bound appropriate to\n" #
    "  the page size you render.\n" #
    "\n" #
    "## OQL data intelligence surface\n" #
    "\n" #
    "The backend exposes `schema()` and `execute(qJson)` through the OQL `Expose` mixin.\n" #
    "Authorization is per entity and evaluated against the live caller:\n" #
    "\n" #
    "- `product`, `faq`, and `siteContent` are public: anyone, including anonymous callers,\n" #
    "  may read them.\n" #
    "- `submission` and `admin` are controller-only: only the platform controller may read\n" #
    "  them. End users cannot read these tables directly.\n" #
    "\n" #
    "`schema()` returns a JSON schema document describing the entities the caller may read.\n" #
    "`execute(qJson)` runs a JSON query and returns a typed result; an invalid query traps\n" #
    "with `OQL: invalid query — <detail>`.\n" #
    "\n" #
    "## Non-obvious gotchas\n" #
    "\n" #
    "- The access-control role (`#admin` / `#user` / `#guest`) and the `admins` map are\n" #
    "  distinct. Being the first access-control admin does not by itself grant content\n" #
    "  management; the caller must also be present in the `admins` map.\n" #
    "- The owner is bootstrapped by `claimOwner`, not by the access-control role. Until the\n" #
    "  owner claims, the admin surface is unreachable; after the claim, only the owner can\n" #
    "  add, remove, or re-role admins.\n" #
    "- `getCallerAdmin()` and `isCallerOwner()` are safe for any caller and return `null` /\n" #
    "  `false` for non-admins, so they can be used to decide whether to render the admin UI.\n" #
    "- `updateSiteContent` merges only the fields present in the patch; `null` leaves the\n" #
    "  stored value untouched, so there is no way to clear a field back to unset through\n" #
    "  this endpoint.\n" #
    "- Newly created products and FAQs start as `#draft` and are invisible to the public\n" #
    "  `listPublished*` endpoints until an admin publishes them.\n" #
    "- `updatedAt` advances on every successful mutation, including a no-op patch.\n" #
    "- Duplicate detection is scoped to the submission kind: the same email and message\n" #
    "  submitted once as a Contact and once as a Waitlist are two distinct records, because\n" #
    "  the two endpoints compare against different kinds.\n" #
    "- A `#duplicate` result is not an error and does not trap; it is a normal successful\n" #
    "  call that stored nothing. Treat it as a distinct success state, not a failure.\n";
  };
};
