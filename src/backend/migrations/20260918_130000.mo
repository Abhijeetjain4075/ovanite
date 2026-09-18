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

  // `OldActor` mirrors the `NewActor` of the preceding migration file
  // (20260918_120000.mo), which initialized all maps empty with next*Id = 1.
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
  };

  public func migration(old : OldActor) : NewActor {
    // Seed exactly five genuine Ovanite FAQs as #published so the Home page
    // accordion renders on a fresh deploy instead of the empty state. They
    // remain fully CMS-editable afterwards: they appear in the admin FAQ list
    // as published and can be edited, unpublished, reordered, or deleted
    // through the existing admin endpoints. `nextFaqId` advances past them.
    let faqs = old.faqs;
    faqs.add(1, {
      id = 1;
      question = "What does Ovanite build?";
      answer = "Ovanite builds thoughtful digital products designed to solve meaningful problems. We focus on software that earns its place: clear in purpose, careful in craft, and useful from the first release.";
      sortOrder = 1;
      state = #published;
      createdAt = 0;
      updatedAt = 0;
    });
    faqs.add(2, {
      id = 2;
      question = "How does Ovanite work?";
      answer = "We start from the problem, not the technology. Each product moves from research and definition through design and engineering to a working release, with the same small team carrying the idea from first sketch to shipped software.";
      sortOrder = 2;
      state = #published;
      createdAt = 0;
      updatedAt = 0;
    });
    faqs.add(3, {
      id = 3;
      question = "How can I get in touch with Ovanite?";
      answer = "Use the contact form on this site. Tell us what you are working on and what a good outcome looks like. We read every message and reply to the ones where we can genuinely help.";
      sortOrder = 3;
      state = #published;
      createdAt = 0;
      updatedAt = 0;
    });
    faqs.add(4, {
      id = 4;
      question = "How does the waitlist work?";
      answer = "Join the waitlist to be the first to know when our products launch. We will only email you when there is something real to share, and you can ask to be removed at any time.";
      sortOrder = 4;
      state = #published;
      createdAt = 0;
      updatedAt = 0;
    });
    faqs.add(5, {
      id = 5;
      question = "Where does Ovanite operate?";
      answer = "Ovanite is a software company that works with people wherever they are. Our products are built to be used online, so the work is not limited by a single location.";
      sortOrder = 5;
      state = #published;
      createdAt = 0;
      updatedAt = 0;
    });
    {
      accessControlState = old.accessControlState;
      admins = old.admins;
      products = old.products;
      faqs;
      submissions = old.submissions;
      siteContent = old.siteContent;
      nextProductId = old.nextProductId;
      nextFaqId = { var value = 6 };
      nextSubmissionId = old.nextSubmissionId;
    };
  };
};
