import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type PublishState = { #draft; #published };
  type SubmissionKind = { #contact; #waitlist };
  type SubmissionStatus = { #new; #read; #handled };

  // `imageKey` is an object-storage reference. `Storage.ExternalBlob` is an
  // alias for `Blob`, inlined here because migration files may not import
  // project modules.
  type Product = {
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

  // The previously deployed canister had no stable state (its `.most`
  // baseline is `actor { }`), so the chain starts from an empty actor.
  type OldActor = {};

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
  };

  public func migration(old : OldActor) : NewActor {
    ignore old;
    {
      accessControlState = AccessControl.initState();
      admins = Map.empty();
      products = Map.empty();
      faqs = Map.empty();
      submissions = Map.empty();
      siteContent = {
        var value = {
          heroHeadline = null;
          heroDescription = null;
          primaryCtaLabel = null;
          primaryCtaHref = null;
          secondaryCtaLabel = null;
          secondaryCtaHref = null;
          philosophyTitle = null;
          philosophyBody = null;
          approachTitle = null;
          approachBody = null;
          aboutTitle = null;
          aboutBody = null;
          contactTitle = null;
          contactBody = null;
          waitlistTitle = null;
          waitlistBody = null;
          privacyBody = null;
          termsBody = null;
          footerText = null;
          updatedAt = 0;
        };
      };
      nextProductId = { var value = 1 };
      nextFaqId = { var value = 1 };
      nextSubmissionId = { var value = 1 };
    };
  };
};
