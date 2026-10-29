module {
  /// Hard server-side release stop for public analytics writes.
  ///
  /// The anonymous frontend consent control is not an authorization boundary:
  /// a caller can invoke a public canister update directly, bypass the browser,
  /// and submit arbitrary distinct paths. Keep this disabled until a bounded
  /// route set plus effective ingress abuse/cost controls are implemented and
  /// tested. This prevents untrusted calls from growing persistent Map state
  /// or consuming unbounded canister cycles while production is unconfigured.
  public let publicAnalyticsWritesEnabled : Bool = false;
};
