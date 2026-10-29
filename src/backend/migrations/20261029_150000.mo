import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type PublishState = { #draft; #published };
  type SubmissionKind = { #contact; #waitlist };
  type SubmissionStatus = { #new; #read; #handled };

  // Current Product shape. Keep legacy imageKey for stable-state compatibility;
  // independently deployed builds use the validated HTTPS imageUrl field.
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

  // Exact actor state after migration 20261029_100000.
  type OldActor = {
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

  /// Disable the package's first-caller generic-admin bootstrap before exposing
  /// an independently deployed canister. Ovanite uses its own principal-bound
  /// owner/admin map for all actual administration; this generic role system
  /// is retained only for the Internet Identity handshake.
  ///
  /// Existing generic #admin roles are demoted to #user as part of the same
  /// state transition. Marking adminAssigned true ensures future callers are
  /// always registered as ordinary users, never silently promoted to admin.
  public func migration(old : OldActor) : NewActor {
    let safeUserRoles = Map.map<Principal, AccessControl.UserRole, AccessControl.UserRole>(
      old.accessControlState.userRoles,
      func (_principal : Principal, role : AccessControl.UserRole) : AccessControl.UserRole {
        switch (role) {
          case (#admin) { #user };
          case (#user) { #user };
          case (#guest) { #guest };
        };
      },
    );
    let accessControlState : AccessControl.AccessControlState = {
      var adminAssigned = true;
      userRoles = safeUserRoles;
    };
    {
      accessControlState;
      admins = old.admins;
      products = old.products;
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
