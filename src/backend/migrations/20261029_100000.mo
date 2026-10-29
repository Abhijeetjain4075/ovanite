import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type PublishState = { #draft; #published };
  type SubmissionKind = { #contact; #waitlist };
  type SubmissionStatus = { #new; #read; #handled };

  // Previous stable Product shape from migration 20260918_140000.
  type OldProduct = {
    id : Nat;
    name : Text;
    description : Text;
    link : ?Text;
    imageKey : ?Blob;
    sortOrder : Nat;
    state : PublishState;
    createdAt : Nat;
    updatedAt : Nat;
  };

  // Current Product shape. Keep imageKey for stable compatibility with
  // existing generated bindings; new independent deployments use imageUrl.
  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    link : ?Text;
    imageKey : ?Blob;
    imageUrl : ?Text;
    sortOrder : Nat;
    state : PublishState;
    createdAt : Nat;
    updatedAt : Nat;
  };

  type Faq = {
    id : Nat;
    question : Text;
    answer : Text;
    sortOrder : Nat;
    state : PublishState;
    createdAt : Nat;
    updatedAt : Nat;
  };

  type SiteContent = {
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
    updatedAt : Nat;
  };

  type Submission = {
    id : Nat;
    kind : SubmissionKind;
    name : Text;
    email : Text;
    message : ?Text;
    status : SubmissionStatus;
    createdAt : Nat;
    updatedAt : Nat;
  };

  type AdminRole = { #owner; #editor; #viewer };

  type Admin = {
    principal : Principal;
    email : ?Text;
    isOwner : Bool;
    role : AdminRole;
    addedAt : Nat;
  };

  type RouteViews = {
    path : Text;
    views : Nat;
    firstSeenAt : Nat;
    lastSeenAt : Nat;
  };

  // Exact actor state after migration 20260918_140000.
  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    admins : Map.Map<Principal, Admin>;
    products : Map.Map<Nat, OldProduct>;
    faqs : Map.Map<Nat, Faq>;
    submissions : Map.Map<Nat, Submission>;
    siteContent : { var value : SiteContent };
    nextProductId : { var value : Nat };
    nextFaqId : { var value : Nat };
    nextSubmissionId : { var value : Nat };
    pageViews : Map.Map<Text, RouteViews>;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    admins : Map.Map<Principal, Admin>;
    products : Map.Map<Nat, Product>;
    faqs : Map.Map<Nat, Faq>;
    submissions : Map.Map<Nat, Submission>;
    siteContent : { var value : SiteContent };
    nextProductId : { var value : Nat };
    nextFaqId : { var value : Nat };
    nextSubmissionId : { var value : Nat };
    pageViews : Map.Map<Text, RouteViews>;
  };

  public func migration(old : OldActor) : NewActor {
    let products = Map.empty<Nat, Product>();
    for (product in old.products.values()) {
      products.add(product.id, {
        id = product.id;
        name = product.name;
        description = product.description;
        link = product.link;
        // Preserve the historical field for stable-state compatibility.
        // Independent deployments write imageUrl; old blob references are kept
        // untouched because their gateway has not been verified here.
        imageKey = product.imageKey;
        imageUrl = null;
        sortOrder = product.sortOrder;
        state = product.state;
        createdAt = product.createdAt;
        updatedAt = product.updatedAt;
      });
    };
    {
      accessControlState = old.accessControlState;
      admins = old.admins;
      products;
      faqs = old.faqs;
      submissions = old.submissions;
      siteContent = old.siteContent;
      nextProductId = old.nextProductId;
      nextFaqId = old.nextFaqId;
      nextSubmissionId = old.nextSubmissionId;
      pageViews = old.pageViews;
    };
  };
};
