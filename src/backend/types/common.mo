module {
  /// Monotonic identifier assigned to every stored record.
  public type Id = Nat;

  /// Wall-clock timestamp in nanoseconds since the Unix epoch (`Time.now()`).
  public type Timestamp = Nat;

  /// Publication state shared by products and FAQs.
  public type PublishState = {
    #draft;
    #published;
  };

  /// Kind of inbound public submission.
  public type SubmissionKind = {
    #contact;
    #waitlist;
  };

  /// Review state of an inbound submission.
  public type SubmissionStatus = {
    #new;
    #read;
    #handled;
  };
};
