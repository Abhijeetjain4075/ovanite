module {
  /// Hard server-side release stop for public writes.
  ///
  /// Keep false until the production deployment has verified storage, data
  /// retention/privacy, input validation, abuse/rate controls and monitoring.
  /// This is deliberately independent from the frontend's Vercel release flag:
  /// a caller can invoke a canister method without using the website UI.
  public let publicSubmissionWritesEnabled : Bool = false;
};
