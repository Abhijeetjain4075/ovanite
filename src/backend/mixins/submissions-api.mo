import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/submissions";
import AdminTypes "../types/admin";
import SubmissionLib "../lib/submissions";
import AdminLib "../lib/admin";
import SubmissionPolicy "../lib/submission-policy";

mixin (
  accessControlState : AccessControl.AccessControlState,
  admins : Map.Map<Principal, AdminTypes.Admin>,
  submissions : Map.Map<Nat, Types.Submission>,
  nextSubmissionId : { var value : Nat },
) {
  /// Traps unless the caller is a registered admin.
  func requireSubmissionAdmin(caller : Principal) {
    if (not AdminLib.isAdmin(admins, caller)) {
      Runtime.trap("Unauthorized: admin access required");
    };
  };

  // Public writes remain disabled at the canister boundary by default.
  // The browser release flag is not a security boundary: callers can invoke
  // these methods directly without loading the Vercel frontend.
  func requirePublicSubmissionWritesEnabled() {
    if (not SubmissionPolicy.publicSubmissionWritesEnabled) {
      Runtime.trap("Public submissions are disabled by backend release policy");
    };
  };

  // ---- Public writes ------------------------------------------------------

  /// Contact writes remain unavailable until the backend release policy is
  /// deliberately enabled after production anti-abuse and privacy controls pass.
  public shared func submitContact(input : Types.ContactInput) : async Types.SubmitResult {
    requirePublicSubmissionWritesEnabled();
    SubmissionLib.createContact(submissions, nextSubmissionId, input, Time.now().toNat());
  };

  /// Waitlist writes remain unavailable until the backend release policy is
  /// deliberately enabled after production anti-abuse and privacy controls pass.
  public shared func submitWaitlist(input : Types.WaitlistInput) : async Types.SubmitResult {
    requirePublicSubmissionWritesEnabled();
    SubmissionLib.createWaitlist(submissions, nextSubmissionId, input, Time.now().toNat());
  };

  // ---- Admin reads --------------------------------------------------------

  /// Submissions matching `filter`, newest first. Admin only.
  public query ({ caller }) func listSubmissions(filter : Types.SubmissionFilter) : async [Types.Submission] {
    requireSubmissionAdmin(caller);
    SubmissionLib.listSubmissions(submissions, filter);
  };

  /// A single submission by id. Admin only.
  public query ({ caller }) func getSubmission(id : Nat) : async ?Types.Submission {
    requireSubmissionAdmin(caller);
    SubmissionLib.getSubmission(submissions, id);
  };

  // ---- Admin writes -------------------------------------------------------

  /// Sets a submission's review status. Admin only.
  public shared ({ caller }) func setSubmissionStatus(id : Nat, status : Types.SubmissionStatus) : async ?Types.Submission {
    requireSubmissionAdmin(caller);
    SubmissionLib.setSubmissionStatus(submissions, id, status, Time.now().toNat());
  };

  /// Deletes a submission. Admin only.
  public shared ({ caller }) func deleteSubmission(id : Nat) : async Bool {
    requireSubmissionAdmin(caller);
    SubmissionLib.deleteSubmission(submissions, id);
  };
};
