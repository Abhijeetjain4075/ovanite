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
    /// Legacy Caffeine object-storage reference retained for stable-state and
    /// Candid compatibility. New independent deployments use imageUrl.
    imageKey : ?Storage.ExternalBlob;
    /// Optional public HTTPS image URL; this does not require a storage gateway.
    imageUrl : ?Text;
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
    imageUrl : ?Text;
    sortOrder : Nat;
  };

  /// Input for updating a product. `null` leaves the stored value untouched.
  public type ProductPatch = {
    name : ?Text;
    description : ?Text;
    link : ?Text;
    imageKey : ?Storage.ExternalBlob;
    /// A provided empty string clears the image URL; null leaves it unchanged.
    imageUrl : ?Text;
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
