import Map "mo:core/Map";
import Storage "mo:caffeineai-object-storage/Storage";
import Char "mo:core/Char";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Types "../types/content";

module {
  /// Hard bounds keep administrative input and public query responses finite.
  public let maxProductCount : Nat = 100;
  public let maxFaqCount : Nat = 100;
  public let maxPublicFaqLimit : Nat = 20;

  /// Validates and normalizes required text at the canister boundary.
  func normalizeRequiredText(value : Text, maximum : Nat, fieldName : Text) : Text {
    let normalized = value.trim(#predicate(Char.isWhitespace));
    let length = Text.size(normalized);
    if (length == 0 or length > maximum) {
      Runtime.trap(fieldName # " has an invalid length");
    };
    normalized;
  };

  /// Returns the patch value when present, otherwise the stored value.
  /// Site-copy fields are bounded independently from the frontend validation.
  func mergeText(patch : ?Text, current : ?Text) : ?Text {
    switch (patch) {
      case (?value) {
        if (Text.size(value) > 10000) {
          Runtime.trap("Site content fields must be 10000 characters or fewer");
        };
        ?value;
      };
      case null { current };
    };
  };

  /// Product hyperlinks are external URLs, not arbitrary browser schemes.
  /// Restrict them to HTTPS and reject credentials and whitespace.
  func normalizeProductLink(value : ?Text) : ?Text {
    switch (value) {
      case null { null };
      case (?raw) {
        let url = raw.trim(#predicate(Char.isWhitespace));
        if (url == "") { return null };
        if (Text.size(url) > 2048) {
          Runtime.trap("Product link must be 2048 characters or fewer");
        };
        if (not url.startsWith(#text "https://")) {
          Runtime.trap("Product link must use HTTPS");
        };
        var authority = "";
        var inAuthority = true;
        var index : Nat = 0;
        for (c in url.chars()) {
          if (index >= 8 and inAuthority) {
            if (c == '/' or c == '?' or c == '#') {
              inAuthority := false;
            } else {
              authority := authority # c.toText();
            };
          };
          index += 1;
        };
        if (Text.size(authority) == 0 or authority.contains(#char '@')) {
          Runtime.trap("Product link must include a host and must not include credentials");
        };
        for (c in url.chars()) {
          if (Char.isWhitespace(c)) {
            Runtime.trap("Product link must not contain whitespace");
          };
        };
        ?url;
      };
    };
  };

  /// Merge an optional external product link; null preserves the current value,
  /// while an explicit empty string clears it.
  func mergeProductLink(patch : ?Text, current : ?Text) : ?Text {
    switch (patch) {
      case null { current };
      case (?value) { normalizeProductLink(?value) };
    };
  };

  /// Validates optional public product image URLs for independent deployments.
  /// Empty strings are the explicit clear operation used by ProductPatch.
  func normalizeImageUrl(value : ?Text) : ?Text {
    switch (value) {
      case null { null };
      case (?raw) {
        let url = raw.trim(#predicate(Char.isWhitespace));
        if (url == "") { return null };
        if (Text.size(url) > 2048) {
          Runtime.trap("Product image URL must be 2048 characters or fewer");
        };
        if (not url.startsWith(#text "https://")) {
          Runtime.trap("Product image URL must use HTTPS");
        };

        // Parse the authority after the eight-character "https://" prefix.
        // Stop at the first path, query, or fragment delimiter. Starting at
        // character zero here incorrectly collected "https:" as the host and
        // rejected every valid HTTPS URL.
        var authority = "";
        var inAuthority = true;
        var index : Nat = 0;
        for (c in url.chars()) {
          if (index >= 8 and inAuthority) {
            if (c == '/' or c == '?' or c == '#') {
              inAuthority := false;
            } else {
              authority := authority # c.toText();
            };
          };
          index += 1;
        };

        if (Text.size(authority) == 0 or authority.contains(#char '@')) {
          Runtime.trap("Product image URL must include a host and must not include credentials");
        };

        // Reject whitespace anywhere, including in the path, query or fragment.
        // Trimmed outer whitespace is accepted, then normalized away above.
        for (c in url.chars()) {
          if (Char.isWhitespace(c)) {
            Runtime.trap("Product image URL must not contain whitespace");
          };
        };
        ?url;
      };
    };
  };

  /// Merge a product image URL. An explicit empty string clears it, while
  /// an absent option leaves the previous value unchanged.
  func mergeImageUrl(patch : ?Text, current : ?Text) : ?Text {
    switch (patch) {
      case null { current };
      case (?value) { normalizeImageUrl(?value) };
    };
  };

  /// Returns the patch blob when present, otherwise the stored blob.
  func mergeBlob(patch : ?Storage.ExternalBlob, current : ?Storage.ExternalBlob) : ?Storage.ExternalBlob {
    switch (patch) {
      case (?value) { ?value };
      case null { current };
    };
  };

  /// Returns every product, published or not, sorted by `sortOrder` then id.
  public func listProducts(products : Map.Map<Nat, Types.Product>) : [Types.Product] {
    let all = products.values().toArray();
    all.sort(func(a, b) {
      if (a.sortOrder < b.sortOrder) { #less }
      else if (a.sortOrder > b.sortOrder) { #greater }
      else if (a.id < b.id) { #less }
      else if (a.id > b.id) { #greater }
      else { #equal };
    });
  };

  /// Returns only published products, sorted by `sortOrder` then id.
  public func listPublishedProducts(products : Map.Map<Nat, Types.Product>) : [Types.Product] {
    // The collection itself is capped on writes, so the public result is bounded.
    listProducts(products).filter(func(p) { p.state == #published });
  };

  /// Returns a single product by id.
  public func getProduct(products : Map.Map<Nat, Types.Product>, id : Nat) : ?Types.Product {
    products.get(id);
  };

  /// Creates a product and returns it.
  public func createProduct(
    products : Map.Map<Nat, Types.Product>,
    nextId : { var value : Nat },
    input : Types.ProductInput,
    now : Nat,
  ) : Types.Product {
    if (products.size() >= maxProductCount) {
      Runtime.trap("Maximum of 100 products reached");
    };
    let id = nextId.value;
    nextId.value := id + 1;
    let product : Types.Product = {
      id;
      name = normalizeRequiredText(input.name, 120, "Product name");
      description = normalizeRequiredText(input.description, 5000, "Product description");
      link = normalizeProductLink(input.link);
      imageKey = input.imageKey;
      imageUrl = normalizeImageUrl(input.imageUrl);
      sortOrder = input.sortOrder;
      state = #draft;
      createdAt = now;
      updatedAt = now;
    };
    products.add(id, product);
    product;
  };

  /// Applies a partial update to a product. Returns `null` when absent.
  public func updateProduct(
    products : Map.Map<Nat, Types.Product>,
    id : Nat,
    patch : Types.ProductPatch,
    now : Nat,
  ) : ?Types.Product {
    switch (products.get(id)) {
      case null { null };
      case (?existing) {
        let updated : Types.Product = {
          id = existing.id;
          name = normalizeRequiredText(patch.name ?? existing.name, 120, "Product name");
          description = normalizeRequiredText(patch.description ?? existing.description, 5000, "Product description");
          link = mergeProductLink(patch.link, existing.link);
          imageKey = mergeBlob(patch.imageKey, existing.imageKey);
          imageUrl = mergeImageUrl(patch.imageUrl, existing.imageUrl);
          sortOrder = patch.sortOrder ?? existing.sortOrder;
          state = existing.state;
          createdAt = existing.createdAt;
          updatedAt = now;
        };
        products.add(id, updated);
        ?updated;
      };
    };
  };

  /// Sets a product's publish state. Returns `null` when absent.
  public func setProductState(
    products : Map.Map<Nat, Types.Product>,
    id : Nat,
    state : Types.PublishState,
    now : Nat,
  ) : ?Types.Product {
    switch (products.get(id)) {
      case null { null };
      case (?existing) {
        let updated : Types.Product = {
          id = existing.id;
          name = existing.name;
          description = existing.description;
          link = existing.link;
          imageKey = existing.imageKey;
          imageUrl = existing.imageUrl;
          sortOrder = existing.sortOrder;
          state;
          createdAt = existing.createdAt;
          updatedAt = now;
        };
        products.add(id, updated);
        ?updated;
      };
    };
  };

  /// Deletes a product. Returns whether a record was removed.
  public func deleteProduct(products : Map.Map<Nat, Types.Product>, id : Nat) : Bool {
    switch (products.get(id)) {
      case null { false };
      case (?_) {
        products.remove(id);
        true;
      };
    };
  };

  /// Returns every FAQ, published or not, sorted by `sortOrder` then id.
  public func listFaqs(faqs : Map.Map<Nat, Types.Faq>) : [Types.Faq] {
    let all = faqs.values().toArray();
    all.sort(func(a, b) {
      if (a.sortOrder < b.sortOrder) { #less }
      else if (a.sortOrder > b.sortOrder) { #greater }
      else if (a.id < b.id) { #less }
      else if (a.id > b.id) { #greater }
      else { #equal };
    });
  };

  /// Returns up to `limit` published FAQs, sorted by `sortOrder` then id.
  public func listPublishedFaqs(faqs : Map.Map<Nat, Types.Faq>, limit : Nat) : [Types.Faq] {
    // Cap the public argument before converting Nat to Int or slicing. A caller
    // cannot submit an enormous Nat to force conversion traps or oversized output.
    let safeLimit = if (limit > maxPublicFaqLimit) { maxPublicFaqLimit } else { limit };
    let published = listFaqs(faqs).filter(func(f) { f.state == #published });
    if (published.size() <= safeLimit) { published } else {
      published.sliceToArray(0, safeLimit.toInt());
    };
  };

  /// Returns a single FAQ by id.
  public func getFaq(faqs : Map.Map<Nat, Types.Faq>, id : Nat) : ?Types.Faq {
    faqs.get(id);
  };

  /// Creates an FAQ and returns it.
  public func createFaq(
    faqs : Map.Map<Nat, Types.Faq>,
    nextId : { var value : Nat },
    input : Types.FaqInput,
    now : Nat,
  ) : Types.Faq {
    if (faqs.size() >= maxFaqCount) {
      Runtime.trap("Maximum of 100 FAQs reached");
    };
    let id = nextId.value;
    nextId.value := id + 1;
    let faq : Types.Faq = {
      id;
      question = normalizeRequiredText(input.question, 300, "FAQ question");
      answer = normalizeRequiredText(input.answer, 10000, "FAQ answer");
      sortOrder = input.sortOrder;
      state = #draft;
      createdAt = now;
      updatedAt = now;
    };
    faqs.add(id, faq);
    faq;
  };

  /// Applies a partial update to an FAQ. Returns `null` when absent.
  public func updateFaq(
    faqs : Map.Map<Nat, Types.Faq>,
    id : Nat,
    patch : Types.FaqPatch,
    now : Nat,
  ) : ?Types.Faq {
    switch (faqs.get(id)) {
      case null { null };
      case (?existing) {
        let updated : Types.Faq = {
          id = existing.id;
          question = normalizeRequiredText(patch.question ?? existing.question, 300, "FAQ question");
          answer = normalizeRequiredText(patch.answer ?? existing.answer, 10000, "FAQ answer");
          sortOrder = patch.sortOrder ?? existing.sortOrder;
          state = existing.state;
          createdAt = existing.createdAt;
          updatedAt = now;
        };
        faqs.add(id, updated);
        ?updated;
      };
    };
  };

  /// Sets an FAQ's publish state. Returns `null` when absent.
  public func setFaqState(
    faqs : Map.Map<Nat, Types.Faq>,
    id : Nat,
    state : Types.PublishState,
    now : Nat,
  ) : ?Types.Faq {
    switch (faqs.get(id)) {
      case null { null };
      case (?existing) {
        let updated : Types.Faq = {
          id = existing.id;
          question = existing.question;
          answer = existing.answer;
          sortOrder = existing.sortOrder;
          state;
          createdAt = existing.createdAt;
          updatedAt = now;
        };
        faqs.add(id, updated);
        ?updated;
      };
    };
  };

  /// Deletes an FAQ. Returns whether a record was removed.
  public func deleteFaq(faqs : Map.Map<Nat, Types.Faq>, id : Nat) : Bool {
    switch (faqs.get(id)) {
      case null { false };
      case (?_) {
        faqs.remove(id);
        true;
      };
    };
  };

  /// Returns the editable site copy.
  public func getSiteContent(content : { var value : Types.SiteContent }) : Types.SiteContent {
    content.value;
  };

  /// Merges a partial patch into the editable site copy and returns the result.
  public func updateSiteContent(
    content : { var value : Types.SiteContent },
    patch : Types.SiteContentPatch,
    now : Nat,
  ) : Types.SiteContent {
    let current = content.value;
    let updated : Types.SiteContent = {
      heroHeadline = mergeText(patch.heroHeadline, current.heroHeadline);
      heroDescription = mergeText(patch.heroDescription, current.heroDescription);
      primaryCtaLabel = mergeText(patch.primaryCtaLabel, current.primaryCtaLabel);
      primaryCtaHref = mergeText(patch.primaryCtaHref, current.primaryCtaHref);
      secondaryCtaLabel = mergeText(patch.secondaryCtaLabel, current.secondaryCtaLabel);
      secondaryCtaHref = mergeText(patch.secondaryCtaHref, current.secondaryCtaHref);
      philosophyTitle = mergeText(patch.philosophyTitle, current.philosophyTitle);
      philosophyBody = mergeText(patch.philosophyBody, current.philosophyBody);
      approachTitle = mergeText(patch.approachTitle, current.approachTitle);
      approachBody = mergeText(patch.approachBody, current.approachBody);
      aboutTitle = mergeText(patch.aboutTitle, current.aboutTitle);
      aboutBody = mergeText(patch.aboutBody, current.aboutBody);
      contactTitle = mergeText(patch.contactTitle, current.contactTitle);
      contactBody = mergeText(patch.contactBody, current.contactBody);
      waitlistTitle = mergeText(patch.waitlistTitle, current.waitlistTitle);
      waitlistBody = mergeText(patch.waitlistBody, current.waitlistBody);
      privacyBody = mergeText(patch.privacyBody, current.privacyBody);
      termsBody = mergeText(patch.termsBody, current.termsBody);
      footerText = mergeText(patch.footerText, current.footerText);
      updatedAt = now;
    };
    content.value := updated;
    updated;
  };
};
