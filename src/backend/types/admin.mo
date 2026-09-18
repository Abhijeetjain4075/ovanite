import Principal "mo:core/Principal";
import Common "common";

module {
  public type Timestamp = Common.Timestamp;

  /// Role assigned to an administrator.
  ///
  /// - `#owner`  — the single owner. May add, remove, and re-role admins.
  /// - `#editor` — may manage content and submissions.
  /// - `#viewer` — read-only access to the admin surface.
  public type AdminRole = {
    #owner;
    #editor;
    #viewer;
  };

  /// An administrator record. The owner is the first admin and cannot be
  /// removed or demoted.
  public type Admin = {
    principal : Principal;
    /// Verified email captured at sign-in, when available.
    email : ?Text;
    isOwner : Bool;
    role : AdminRole;
    addedAt : Timestamp;
  };
};
