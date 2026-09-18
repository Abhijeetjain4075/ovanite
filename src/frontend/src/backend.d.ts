import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface Admin {
    principal: Principal;
    role: AdminRole;
    email?: string;
    addedAt: Timestamp;
    isOwner: boolean;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface ContactInput {
    name: string;
    email: string;
    message: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Faq {
    id: Id;
    question: string;
    sortOrder: bigint;
    createdAt: Timestamp;
    answer: string;
    updatedAt: Timestamp;
    state: PublishState;
}
export interface FaqInput {
    question: string;
    sortOrder: bigint;
    answer: string;
}
export interface FaqPatch {
    question?: string;
    sortOrder?: bigint;
    answer?: string;
}
export type Id = bigint;
export interface Product {
    id: Id;
    sortOrder: bigint;
    link?: string;
    name: string;
    createdAt: Timestamp;
    description: string;
    updatedAt: Timestamp;
    state: PublishState;
    imageKey?: ExternalBlob;
}
export interface ProductInput {
    sortOrder: bigint;
    link?: string;
    name: string;
    description: string;
    imageKey?: ExternalBlob;
}
export interface ProductPatch {
    sortOrder?: bigint;
    link?: string;
    name?: string;
    description?: string;
    imageKey?: ExternalBlob;
}
export type RecordViewResult = {
    __kind__: "recorded";
    recorded: RouteViews;
} | {
    __kind__: "ignored";
    ignored: null;
};
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type RoutePath = string;
export interface RouteViews {
    lastSeenAt: Timestamp;
    views: bigint;
    firstSeenAt: Timestamp;
    path: RoutePath;
}
export interface SiteContent {
    contactBody?: string;
    privacyBody?: string;
    heroDescription?: string;
    primaryCtaHref?: string;
    primaryCtaLabel?: string;
    philosophyTitle?: string;
    contactTitle?: string;
    philosophyBody?: string;
    aboutTitle?: string;
    waitlistTitle?: string;
    secondaryCtaHref?: string;
    updatedAt: Timestamp;
    approachBody?: string;
    aboutBody?: string;
    termsBody?: string;
    approachTitle?: string;
    heroHeadline?: string;
    secondaryCtaLabel?: string;
    footerText?: string;
    waitlistBody?: string;
}
export interface SiteContentPatch {
    contactBody?: string;
    privacyBody?: string;
    heroDescription?: string;
    primaryCtaHref?: string;
    primaryCtaLabel?: string;
    philosophyTitle?: string;
    contactTitle?: string;
    philosophyBody?: string;
    aboutTitle?: string;
    waitlistTitle?: string;
    secondaryCtaHref?: string;
    approachBody?: string;
    aboutBody?: string;
    termsBody?: string;
    approachTitle?: string;
    heroHeadline?: string;
    secondaryCtaLabel?: string;
    footerText?: string;
    waitlistBody?: string;
}
export interface Submission {
    id: Id;
    status: SubmissionStatus;
    kind: SubmissionKind;
    name: string;
    createdAt: Timestamp;
    email: string;
    updatedAt: Timestamp;
    message?: string;
}
export interface SubmissionFilter {
    status?: SubmissionStatus;
    kind?: SubmissionKind;
}
export type SubmitResult = {
    __kind__: "created";
    created: Submission;
} | {
    __kind__: "duplicate";
    duplicate: Submission;
};
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface WaitlistInput {
    name: string;
    note?: string;
    email: string;
}
export enum AdminRole {
    owner = "owner",
    editor = "editor",
    viewer = "viewer"
}
export enum PublishState {
    published = "published",
    draft = "draft"
}
export enum SubmissionKind {
    contact = "contact",
    waitlist = "waitlist"
}
export enum SubmissionStatus {
    new_ = "new",
    handled = "handled",
    read = "read"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Grants admin access to `principal` with `role`. Owner only.
     */
    addAdmin(principal: Principal, role: AdminRole): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / One-time ownership bootstrap. Succeeds only when no owner exists yet and
     * / `email` matches the configured owner email. After the owner exists this
     * / always returns `false`, so no caller can self-grant admin access.
     */
    claimOwner(email: string): Promise<boolean>;
    /**
     * / Creates an FAQ. Admin only.
     */
    createFaq(input: FaqInput): Promise<Faq>;
    /**
     * / Creates a product. Admin only.
     */
    createProduct(input: ProductInput): Promise<Product>;
    /**
     * / Deletes an FAQ. Admin only.
     */
    deleteFaq(id: bigint): Promise<boolean>;
    /**
     * / Deletes a product. Admin only.
     */
    deleteProduct(id: bigint): Promise<boolean>;
    /**
     * / Deletes a submission. Admin only.
     */
    deleteSubmission(id: bigint): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Returns the backend's public API documentation as Markdown.
     */
    getApiDoc(): Promise<string>;
    /**
     * / Returns the caller's admin record, or `null` when not an admin.
     */
    getCallerAdmin(): Promise<Admin | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / A single FAQ by id. Admin only.
     */
    getFaq(id: bigint): Promise<Faq | null>;
    /**
     * / Returns the aggregate view total for a single route, or `null` when the
     * / route has never been recorded.
     */
    getPageViews(path: string): Promise<RouteViews | null>;
    /**
     * / A single product by id. Admin only.
     */
    getProduct(id: bigint): Promise<Product | null>;
    /**
     * / Editable site copy for the public website.
     */
    getSiteContent(): Promise<SiteContent>;
    /**
     * / A single submission by id. Admin only.
     */
    getSubmission(id: bigint): Promise<Submission | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Returns whether the caller is the owner.
     */
    isCallerOwner(): Promise<boolean>;
    /**
     * / Returns whether the owner has been claimed yet. While this is `false`,
     * / `claimOwner` is open to the configured owner email.
     */
    isOwnerClaimed(): Promise<boolean>;
    /**
     * / Every admin. Admin only.
     */
    listAdmins(): Promise<Array<Admin>>;
    /**
     * / Every FAQ, published or not. Admin only.
     */
    listAllFaqs(): Promise<Array<Faq>>;
    /**
     * / Every product, published or not. Admin only.
     */
    listAllProducts(): Promise<Array<Product>>;
    /**
     * / Returns every recorded route with its aggregate total, ordered by path.
     */
    listPageViews(): Promise<Array<RouteViews>>;
    /**
     * / Up to `limit` published FAQs in admin-defined order.
     */
    listPublishedFaqs(limit: bigint): Promise<Array<Faq>>;
    /**
     * / Published products in admin-defined order.
     */
    listPublishedProducts(): Promise<Array<Product>>;
    /**
     * / Submissions matching `filter`, newest first. Admin only.
     */
    listSubmissions(filter: SubmissionFilter): Promise<Array<Submission>>;
    /**
     * / Records one view of a public route. Callable by anyone, including
     * / anonymous callers, because the frontend only calls it after the visitor
     * / has consented to analytics.
     * /
     * / The path is normalized and validated by the backend; an invalid path or an
     * / admin route is ignored and stores nothing. The counter is additive and
     * / stores only an aggregate total — no IP, user agent, principal, or session
     * / identifier is ever read or stored.
     */
    recordPageView(path: string): Promise<RecordViewResult>;
    /**
     * / Revokes admin access from `principal`. Owner only; the owner cannot be
     * / removed.
     */
    removeAdmin(principal: Principal): Promise<boolean>;
    schema(): Promise<string>;
    /**
     * / Changes an admin's role. Owner only; the owner's own role cannot change.
     */
    setAdminRole(principal: Principal, role: AdminRole): Promise<Admin | null>;
    /**
     * / Publishes or unpublishes an FAQ. Admin only.
     */
    setFaqState(id: bigint, state: PublishState): Promise<Faq | null>;
    /**
     * / Publishes or unpublishes a product. Admin only.
     */
    setProductState(id: bigint, state: PublishState): Promise<Product | null>;
    /**
     * / Sets a submission's review status. Admin only.
     */
    setSubmissionStatus(id: bigint, status: SubmissionStatus): Promise<Submission | null>;
    /**
     * / Stores a Contact submission. Callable by anyone, including anonymous.
     * / Returns `#created` with the new record, or `#duplicate` with the existing
     * / record when the same normalized email and message were already received.
     */
    submitContact(input: ContactInput): Promise<SubmitResult>;
    /**
     * / Stores a Waitlist submission. Callable by anyone, including anonymous.
     * / Returns `#created` with the new record, or `#duplicate` with the existing
     * / record when the same normalized email and note were already received.
     */
    submitWaitlist(input: WaitlistInput): Promise<SubmitResult>;
    /**
     * / Applies a partial update to an FAQ. Admin only.
     */
    updateFaq(id: bigint, patch: FaqPatch): Promise<Faq | null>;
    /**
     * / Applies a partial update to a product. Admin only.
     */
    updateProduct(id: bigint, patch: ProductPatch): Promise<Product | null>;
    /**
     * / Merges a partial patch into the editable site copy. Admin only.
     */
    updateSiteContent(patch: SiteContentPatch): Promise<SiteContent>;
}
