import Char "mo:core/Char";
import Map "mo:core/Map";
import Types "../types/submissions";

module {
  /// Conservative, deterministic normalization: trim surrounding whitespace and
  /// case-fold. Used for the email only, so genuinely different submissions are
  /// never blocked.
  public func normalizeEmail(email : Text) : Text {
    email.trim(#predicate(Char.isWhitespace)).toLower();
  };

  /// Conservative, deterministic normalization for a message/note: trim
  /// surrounding whitespace only. Case is preserved because message content is
  /// meaningful. An absent or empty note normalizes to `null`, which is a
  /// distinct value from any non-empty note.
  public func normalizeMessage(message : ?Text) : ?Text {
    switch (message) {
      case null { null };
      case (?text) {
        let trimmed = text.trim(#predicate(Char.isWhitespace));
        if (trimmed == "") { null } else { ?trimmed };
      };
    };
  };

  /// Returns the first stored submission of `kind` whose normalized email and
  /// normalized message/note both match, or `null` when none does.
  func findDuplicate(
    submissions : Map.Map<Nat, Types.Submission>,
    kind : Types.SubmissionKind,
    email : Text,
    message : ?Text,
  ) : ?Types.Submission {
    let normalizedEmail = normalizeEmail(email);
    let normalizedMessage = normalizeMessage(message);
    submissions.values().find(func(s) {
      s.kind == kind and
      normalizeEmail(s.email) == normalizedEmail and
      normalizeMessage(s.message) == normalizedMessage;
    });
  };

  /// Stores a Contact submission, or reports the existing duplicate. A
  /// duplicate is the same normalized email with the same normalized message.
  public func createContact(
    submissions : Map.Map<Nat, Types.Submission>,
    nextId : { var value : Nat },
    input : Types.ContactInput,
    now : Nat,
  ) : Types.SubmitResult {
    switch (findDuplicate(submissions, #contact, input.email, ?input.message)) {
      case (?existing) { #duplicate(existing) };
      case null {
        let id = nextId.value;
        nextId.value := id + 1;
        let submission : Types.Submission = {
          id;
          kind = #contact;
          name = input.name;
          email = input.email;
          message = ?input.message;
          status = #new;
          createdAt = now;
          updatedAt = now;
        };
        submissions.add(id, submission);
        #created(submission);
      };
    };
  };

  /// Stores a Waitlist submission, or reports the existing duplicate. A
  /// duplicate is the same normalized email with the same normalized note; an
  /// absent or empty note is distinct from a non-empty note.
  public func createWaitlist(
    submissions : Map.Map<Nat, Types.Submission>,
    nextId : { var value : Nat },
    input : Types.WaitlistInput,
    now : Nat,
  ) : Types.SubmitResult {
    switch (findDuplicate(submissions, #waitlist, input.email, input.note)) {
      case (?existing) { #duplicate(existing) };
      case null {
        let id = nextId.value;
        nextId.value := id + 1;
        let submission : Types.Submission = {
          id;
          kind = #waitlist;
          name = input.name;
          email = input.email;
          message = input.note;
          status = #new;
          createdAt = now;
          updatedAt = now;
        };
        submissions.add(id, submission);
        #created(submission);
      };
    };
  };

  /// Returns submissions matching `filter`, newest first.
  public func listSubmissions(
    submissions : Map.Map<Nat, Types.Submission>,
    filter : Types.SubmissionFilter,
  ) : [Types.Submission] {
    let all = submissions.values().toArray();
    let filtered = all.filter(func(s) {
      let kindOk = switch (filter.kind) {
        case null { true };
        case (?k) { s.kind == k };
      };
      let statusOk = switch (filter.status) {
        case null { true };
        case (?st) { s.status == st };
      };
      kindOk and statusOk;
    });
    filtered.sort(func(a, b) {
      if (a.createdAt > b.createdAt) { #less }
      else if (a.createdAt < b.createdAt) { #greater }
      else if (a.id > b.id) { #less }
      else if (a.id < b.id) { #greater }
      else { #equal };
    });
  };

  /// Returns a single submission by id.
  public func getSubmission(
    submissions : Map.Map<Nat, Types.Submission>,
    id : Nat,
  ) : ?Types.Submission {
    submissions.get(id);
  };

  /// Sets a submission's review status. Returns `null` when absent.
  public func setSubmissionStatus(
    submissions : Map.Map<Nat, Types.Submission>,
    id : Nat,
    status : Types.SubmissionStatus,
    now : Nat,
  ) : ?Types.Submission {
    switch (submissions.get(id)) {
      case null { null };
      case (?existing) {
        let updated : Types.Submission = {
          id = existing.id;
          kind = existing.kind;
          name = existing.name;
          email = existing.email;
          message = existing.message;
          status;
          createdAt = existing.createdAt;
          updatedAt = now;
        };
        submissions.add(id, updated);
        ?updated;
      };
    };
  };

  /// Deletes a submission. Returns whether a record was removed.
  public func deleteSubmission(
    submissions : Map.Map<Nat, Types.Submission>,
    id : Nat,
  ) : Bool {
    switch (submissions.get(id)) {
      case null { false };
      case (?_) {
        submissions.remove(id);
        true;
      };
    };
  };
};
