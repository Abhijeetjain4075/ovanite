import Map "mo:core/Map";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/content";

module {
  /// Returns the patch value when present, otherwise the stored value.
  func mergeText(patch : ?Text, current : ?Text) : ?Text {
    switch (patch) {
      case (?value) { ?value };
      case null { current };
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
    let id = nextId.value;
    nextId.value := id + 1;
    let product : Types.Product = {
      id;
      name = input.name;
      description = input.description;
      link = input.link;
      imageKey = input.imageKey;
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
          name = patch.name ?? existing.name;
          description = patch.description ?? existing.description;
          link = mergeText(patch.link, existing.link);
          imageKey = mergeBlob(patch.imageKey, existing.imageKey);
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
    let published = listFaqs(faqs).filter(func(f) { f.state == #published });
    if (published.size() <= limit) { published } else {
      published.sliceToArray(0, limit.toInt());
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
    let id = nextId.value;
    nextId.value := id + 1;
    let faq : Types.Faq = {
      id;
      question = input.question;
      answer = input.answer;
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
          question = patch.question ?? existing.question;
          answer = patch.answer ?? existing.answer;
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
