import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type PublishState = Common.PublishState;

  /// A product shown on the public Products page and Home page.
  public type Product = {
    id : Id;
    name : Text;
    description : Text;
    /// Optional external link (product site, docs, waitlist).
    link : ?Text;
    /// Optional object-storage blob for the product image/logo. The bytes are
    /// uploaded by the frontend through the object-storage gateway; the backend
    /// stores the reference.
    imageKey : ?Storage.ExternalBlob;
    /// Admin-defined display order; lower values render first.
    sortOrder : Nat;
    state : PublishState;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// A frequently asked question rendered in the Home page accordion.
  public type Faq = {
    id : Id;
    question : Text;
    answer : Text;
    /// Admin-defined display order; lower values render first.
    sortOrder : Nat;
    state : PublishState;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// Editable site copy. Every field is optional so the frontend can fall back
  /// to its own defaults until an admin saves a value.
  public type SiteContent = {
    heroHeadline : ?Text;
    heroDescription : ?Text;
    primaryCtaLabel : ?Text;
    primaryCtaHref : ?Text;
    secondaryCtaLabel : ?Text;
    secondaryCtaHref : ?Text;
    philosophyTitle : ?Text;
    philosophyBody : ?Text;
    approachTitle : ?Text;
    approachBody : ?Text;
    aboutTitle : ?Text;
    aboutBody : ?Text;
    contactTitle : ?Text;
    contactBody : ?Text;
    waitlistTitle : ?Text;
    waitlistBody : ?Text;
    privacyBody : ?Text;
    termsBody : ?Text;
    footerText : ?Text;
    updatedAt : Timestamp;
  };

  /// Partial update payload for `SiteContent`. Only the fields present are
  /// written; `null` leaves the stored value untouched.
  public type SiteContentPatch = {
    heroHeadline : ?Text;
    heroDescription : ?Text;
    primaryCtaLabel : ?Text;
    primaryCtaHref : ?Text;
    secondaryCtaLabel : ?Text;
    secondaryCtaHref : ?Text;
    philosophyTitle : ?Text;
    philosophyBody : ?Text;
    approachTitle : ?Text;
    approachBody : ?Text;
    aboutTitle : ?Text;
    aboutBody : ?Text;
    contactTitle : ?Text;
    contactBody : ?Text;
    waitlistTitle : ?Text;
    waitlistBody : ?Text;
    privacyBody : ?Text;
    termsBody : ?Text;
    footerText : ?Text;
  };

  /// Input for creating a product. `id`, timestamps and publish state are
  /// assigned by the backend.
  public type ProductInput = {
    name : Text;
    description : Text;
    link : ?Text;
    imageKey : ?Storage.ExternalBlob;
    sortOrder : Nat;
  };

  /// Input for updating a product. `null` leaves the stored value untouched.
  public type ProductPatch = {
    name : ?Text;
    description : ?Text;
    link : ?Text;
    imageKey : ?Storage.ExternalBlob;
    sortOrder : ?Nat;
  };

  /// Input for creating an FAQ.
  public type FaqInput = {
    question : Text;
    answer : Text;
    sortOrder : Nat;
  };

  /// Input for updating an FAQ. `null` leaves the stored value untouched.
  public type FaqPatch = {
    question : ?Text;
    answer : ?Text;
    sortOrder : ?Nat;
  };
};
