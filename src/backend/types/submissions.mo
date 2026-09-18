import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type SubmissionKind = Common.SubmissionKind;
  public type SubmissionStatus = Common.SubmissionStatus;

  /// A Contact or Waitlist submission stored for owner review.
  public type Submission = {
    id : Id;
    kind : SubmissionKind;
    name : Text;
    email : Text;
    /// Contact message, or the optional Waitlist note.
    message : ?Text;
    status : SubmissionStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// Input for a public Contact submission.
  public type ContactInput = {
    name : Text;
    email : Text;
    message : Text;
  };

  /// Input for a public Waitlist submission.
  public type WaitlistInput = {
    name : Text;
    email : Text;
    note : ?Text;
  };

  /// Filter for the admin submissions inbox. `null` means "any".
  public type SubmissionFilter = {
    kind : ?SubmissionKind;
    status : ?SubmissionStatus;
  };

  /// Outcome of a public submission. `#created` carries the newly stored
  /// record; `#duplicate` carries the existing record that matched the
  /// normalized email plus message/note, so the frontend can show an
  /// "Already received" message instead of a generic error.
  public type SubmitResult = {
    #created : Submission;
    #duplicate : Submission;
  };
};
