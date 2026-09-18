import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/content";
import ContentLib "../lib/content";
import AdminLib "../lib/admin";
import AdminTypes "../types/admin";

mixin (
  accessControlState : AccessControl.AccessControlState,
  admins : Map.Map<Principal, AdminTypes.Admin>,
  products : Map.Map<Nat, Types.Product>,
  faqs : Map.Map<Nat, Types.Faq>,
  siteContent : { var value : Types.SiteContent },
  nextProductId : { var value : Nat },
  nextFaqId : { var value : Nat },
) {
  /// Traps unless the caller is a registered admin.
  func requireContentAdmin(caller : Principal) {
    if (not AdminLib.isAdmin(admins, caller)) {
      Runtime.trap("Unauthorized: admin access required");
    };
  };

  // ---- Public reads -------------------------------------------------------

  /// Published products in admin-defined order.
  public query func listPublishedProducts() : async [Types.Product] {
    ContentLib.listPublishedProducts(products);
  };

  /// Up to `limit` published FAQs in admin-defined order.
  public query func listPublishedFaqs(limit : Nat) : async [Types.Faq] {
    ContentLib.listPublishedFaqs(faqs, limit);
  };

  /// Editable site copy for the public website.
  public query func getSiteContent() : async Types.SiteContent {
    ContentLib.getSiteContent(siteContent);
  };

  // ---- Admin reads --------------------------------------------------------

  /// Every product, published or not. Admin only.
  public query ({ caller }) func listAllProducts() : async [Types.Product] {
    requireContentAdmin(caller);
    ContentLib.listProducts(products);
  };

  /// A single product by id. Admin only.
  public query ({ caller }) func getProduct(id : Nat) : async ?Types.Product {
    requireContentAdmin(caller);
    ContentLib.getProduct(products, id);
  };

  /// Every FAQ, published or not. Admin only.
  public query ({ caller }) func listAllFaqs() : async [Types.Faq] {
    requireContentAdmin(caller);
    ContentLib.listFaqs(faqs);
  };

  /// A single FAQ by id. Admin only.
  public query ({ caller }) func getFaq(id : Nat) : async ?Types.Faq {
    requireContentAdmin(caller);
    ContentLib.getFaq(faqs, id);
  };

  // ---- Admin writes -------------------------------------------------------

  /// Creates a product. Admin only.
  public shared ({ caller }) func createProduct(input : Types.ProductInput) : async Types.Product {
    requireContentAdmin(caller);
    ContentLib.createProduct(products, nextProductId, input, Time.now().toNat());
  };

  /// Applies a partial update to a product. Admin only.
  public shared ({ caller }) func updateProduct(id : Nat, patch : Types.ProductPatch) : async ?Types.Product {
    requireContentAdmin(caller);
    ContentLib.updateProduct(products, id, patch, Time.now().toNat());
  };

  /// Publishes or unpublishes a product. Admin only.
  public shared ({ caller }) func setProductState(id : Nat, state : Types.PublishState) : async ?Types.Product {
    requireContentAdmin(caller);
    ContentLib.setProductState(products, id, state, Time.now().toNat());
  };

  /// Deletes a product. Admin only.
  public shared ({ caller }) func deleteProduct(id : Nat) : async Bool {
    requireContentAdmin(caller);
    ContentLib.deleteProduct(products, id);
  };

  /// Creates an FAQ. Admin only.
  public shared ({ caller }) func createFaq(input : Types.FaqInput) : async Types.Faq {
    requireContentAdmin(caller);
    ContentLib.createFaq(faqs, nextFaqId, input, Time.now().toNat());
  };

  /// Applies a partial update to an FAQ. Admin only.
  public shared ({ caller }) func updateFaq(id : Nat, patch : Types.FaqPatch) : async ?Types.Faq {
    requireContentAdmin(caller);
    ContentLib.updateFaq(faqs, id, patch, Time.now().toNat());
  };

  /// Publishes or unpublishes an FAQ. Admin only.
  public shared ({ caller }) func setFaqState(id : Nat, state : Types.PublishState) : async ?Types.Faq {
    requireContentAdmin(caller);
    ContentLib.setFaqState(faqs, id, state, Time.now().toNat());
  };

  /// Deletes an FAQ. Admin only.
  public shared ({ caller }) func deleteFaq(id : Nat) : async Bool {
    requireContentAdmin(caller);
    ContentLib.deleteFaq(faqs, id);
  };

  /// Merges a partial patch into the editable site copy. Admin only.
  public shared ({ caller }) func updateSiteContent(patch : Types.SiteContentPatch) : async Types.SiteContent {
    requireContentAdmin(caller);
    ContentLib.updateSiteContent(siteContent, patch, Time.now().toNat());
  };
};
