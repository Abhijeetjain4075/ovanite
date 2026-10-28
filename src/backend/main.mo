import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Prim "mo:⛔";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Storage "mo:caffeineai-object-storage/Storage";
import Expose "mo:caffeineai-oql/Expose";
import OQL "mo:caffeineai-oql";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import Types "mo:caffeineai-oql/Types";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import BlobValue "mo:caffeineai-oql/BlobValue";
import ContentTypes "types/content";
import SubmissionTypes "types/submissions";
import AdminTypes "types/admin";
import AnalyticsTypes "types/analytics";
import ContentApi "mixins/content-api";
import SubmissionsApi "mixins/submissions-api";
import AdminApi "mixins/admin-api";
import AnalyticsApi "mixins/analytics-api";
import ApiDocMixin "mixins/api-doc";

actor {
  // OQL value instances for shapes the auto-derivation cannot resolve:
  // `?Text` and the local variants `PublishState`, `SubmissionKind`,
  // `SubmissionStatus`. Each maps to a scalar `Types.Value`.
  func optionalTextValue(value : ?Text) : Types.Value {
    switch (value) {
      case (?text) { #text text };
      case null { #null_ };
    };
  };

  // `imageKey` is an object-storage reference (`Storage.ExternalBlob`, i.e.
  // `Blob`). `Types.Value` has no blob arm, so an absent reference maps to
  // `#null_` and a present one renders through `BlobValue._toRow` (the
  // ExternalBlob reference is UTF-8, so it stays queryable as text).
  func optionalBlobValue(value : ?Storage.ExternalBlob) : Types.Value {
    switch (value) {
      case (?blob) { blob._toRow() };
      case null { #null_ };
    };
  };

  func publishStateValue(state : ContentTypes.PublishState) : Types.Value {
    switch (state) {
      case (#draft) { #text "draft" };
      case (#published) { #text "published" };
    };
  };

  func submissionKindValue(kind : SubmissionTypes.SubmissionKind) : Types.Value {
    switch (kind) {
      case (#contact) { #text "contact" };
      case (#waitlist) { #text "waitlist" };
    };
  };

  func submissionStatusValue(status : SubmissionTypes.SubmissionStatus) : Types.Value {
    switch (status) {
      case (#new) { #text "new" };
      case (#read) { #text "read" };
      case (#handled) { #text "handled" };
    };
  };

  func adminRoleValue(role : AdminTypes.AdminRole) : Types.Value {
    switch (role) {
      case (#owner) { #text "owner" };
      case (#editor) { #text "editor" };
      case (#viewer) { #text "viewer" };
    };
  };

  let accessControlState : AccessControl.AccessControlState;
  let admins : Map.Map<Principal, AdminTypes.Admin>;
  let products : Map.Map<Nat, ContentTypes.Product>;
  let faqs : Map.Map<Nat, ContentTypes.Faq>;
  let submissions : Map.Map<Nat, SubmissionTypes.Submission>;
  let siteContent : { var value : ContentTypes.SiteContent };
  let nextProductId : { var value : Nat };
  let nextFaqId : { var value : Nat };
  let nextSubmissionId : { var value : Nat };
  let pageViews : Map.Map<Text, AnalyticsTypes.RouteViews>;

  include MixinObjectStorage();
  include MixinAuthorization(accessControlState, null);
  include AdminApi(accessControlState, admins);
  // `isCallerAdmin` is provided by MixinAuthorization above; AdminApi must not
  // redeclare it.
  include ContentApi(accessControlState, admins, products, faqs, siteContent, nextProductId, nextFaqId);
  include SubmissionsApi(accessControlState, admins, submissions, nextSubmissionId);
  include AnalyticsApi(pageViews);
  include ApiDocMixin();

  /// One-time first-install seed for the public FAQ collection.
  ///
  /// Enhanced migration chains run on upgrades, not as a first-install
  /// initializer. The production deployer must call this immediately after
  /// installing a fresh canister and before exposing it to visitors.
  /// The caller must be a canister controller, and the nextFaqId == 0 guard
  /// makes initialization one-shot even if all FAQs are later deleted.
  public shared ({ caller }) func initializeDefaultFaqs() : async Bool {
    if (not Prim.isController(caller)) {
      return false;
    };
    if (nextFaqId.value != 0 or faqs.size() != 0) {
      return false;
    };

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
    nextFaqId.value := 6;
    true;
  };

  include Expose({
    entities = [
      products.toEntityManual("product", "Product", "id")
        .payload("id", func p = p.id, )
        .payload("name", func p = p.name, )
        .payload("description", func p = p.description, )
        .payload("link", func p = p.link, optionalTextValue)
        .payload("imageKey", func p = p.imageKey, optionalBlobValue)
        .payload("sortOrder", func p = p.sortOrder, )
        .payload("state", func p = p.state, publishStateValue)
        .payload("createdAt", func p = p.createdAt, )
        .payload("updatedAt", func p = p.updatedAt, )
        .sample({
          id = 0;
          name = "";
          description = "";
          link = null;
          imageKey = null;
          sortOrder = 0;
          state = #draft;
          createdAt = 0;
          updatedAt = 0;
        })
        .public_()
        .build(),
      faqs.toEntityManual("faq", "Faq", "id")
        .payload("id", func f = f.id, )
        .payload("question", func f = f.question, )
        .payload("answer", func f = f.answer, )
        .payload("sortOrder", func f = f.sortOrder, )
        .payload("state", func f = f.state, publishStateValue)
        .payload("createdAt", func f = f.createdAt, )
        .payload("updatedAt", func f = f.updatedAt, )
        .sample({
          id = 0;
          question = "";
          answer = "";
          sortOrder = 0;
          state = #draft;
          createdAt = 0;
          updatedAt = 0;
        })
        .public_()
        .build(),
      submissions.toEntityManual("submission", "Submission", "id")
        .payload("id", func s = s.id, )
        .payload("kind", func s = s.kind, submissionKindValue)
        .payload("name", func s = s.name, )
        .payload("email", func s = s.email, )
        .payload("message", func s = s.message, optionalTextValue)
        .payload("status", func s = s.status, submissionStatusValue)
        .payload("createdAt", func s = s.createdAt, )
        .payload("updatedAt", func s = s.updatedAt, )
        .sample({
          id = 0;
          kind = #contact;
          name = "";
          email = "";
          message = null;
          status = #new;
          createdAt = 0;
          updatedAt = 0;
        })
        .controllerOnly()
        .build(),
      admins.toEntityManual("admin", "Admin", "principal")
        .payload("principal", func a = a.principal, )
        .payload("email", func a = a.email, optionalTextValue)
        .payload("isOwner", func a = a.isOwner, )
        .payload("role", func a = a.role, adminRoleValue)
        .payload("addedAt", func a = a.addedAt, )
        .sample({
          principal = Principal.fromText("aaaaa-aa");
          email = null;
          isOwner = false;
          role = #viewer;
          addedAt = 0;
        })
        .controllerOnly()
        .build(),
      // `siteContent` is a singleton record, not a collection: expose it as a
      // one-row entity so the editable site copy is queryable. The iterator
      // yields the current record (or nothing before the first save).
      OQL.Entity.manual<ContentTypes.SiteContent>(
        "siteContent",
        func () = [siteContent.value].values(),
        "SiteContent",
        "updatedAt",
      )
        .payload("heroHeadline", func c = c.heroHeadline, optionalTextValue)
        .payload("heroDescription", func c = c.heroDescription, optionalTextValue)
        .payload("primaryCtaLabel", func c = c.primaryCtaLabel, optionalTextValue)
        .payload("primaryCtaHref", func c = c.primaryCtaHref, optionalTextValue)
        .payload("secondaryCtaLabel", func c = c.secondaryCtaLabel, optionalTextValue)
        .payload("secondaryCtaHref", func c = c.secondaryCtaHref, optionalTextValue)
        .payload("philosophyTitle", func c = c.philosophyTitle, optionalTextValue)
        .payload("philosophyBody", func c = c.philosophyBody, optionalTextValue)
        .payload("approachTitle", func c = c.approachTitle, optionalTextValue)
        .payload("approachBody", func c = c.approachBody, optionalTextValue)
        .payload("aboutTitle", func c = c.aboutTitle, optionalTextValue)
        .payload("aboutBody", func c = c.aboutBody, optionalTextValue)
        .payload("contactTitle", func c = c.contactTitle, optionalTextValue)
        .payload("contactBody", func c = c.contactBody, optionalTextValue)
        .payload("waitlistTitle", func c = c.waitlistTitle, optionalTextValue)
        .payload("waitlistBody", func c = c.waitlistBody, optionalTextValue)
        .payload("privacyBody", func c = c.privacyBody, optionalTextValue)
        .payload("termsBody", func c = c.termsBody, optionalTextValue)
        .payload("footerText", func c = c.footerText, optionalTextValue)
        .payload("updatedAt", func c = c.updatedAt, )
        .sample({
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
        })
        .public_()
        .build(),
    ];
  });
};
