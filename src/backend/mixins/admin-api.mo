import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/admin";
import AdminLib "../lib/admin";

mixin (
  accessControlState : AccessControl.AccessControlState,
  admins : Map.Map<Principal, Types.Admin>,
) {
  /// Traps unless the caller is a registered admin.
  func requireAdmin(caller : Principal) {
    if (not AdminLib.isAdmin(admins, caller)) {
      Runtime.trap("Unauthorized: admin access required");
    };
  };

  /// Traps unless the caller is the owner.
  func requireOwner(caller : Principal) {
    if (not AdminLib.isOwner(admins, caller)) {
      Runtime.trap("Unauthorized: owner access required");
    };
  };

  /// Returns the caller's admin record, or `null` when not an admin.
  public query ({ caller }) func getCallerAdmin() : async ?Types.Admin {
    AdminLib.getAdmin(admins, caller);
  };

  /// Returns whether the caller is the owner.
  public query ({ caller }) func isCallerOwner() : async Bool {
    AdminLib.isOwner(admins, caller);
  };

  /// Returns whether owner setup is closed. This is true when an owner already
  /// exists OR when no owner principal has been configured. It is false only
  /// while a configured owner principal is eligible to claim an empty deployment.
  public query func isOwnerClaimed() : async Bool {
    not AdminLib.isEmpty(admins) or not AdminLib.isOwnerBootstrapConfigured();
  };

  /// One-time ownership bootstrap. The caller must match the owner principal
  /// configured in backend source before deployment. The email is only a
  /// secondary consistency check; it is never sufficient to authorize access.
  public shared ({ caller }) func claimOwner(email : Text) : async Bool {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: signed-in caller required");
    };
    if (not AdminLib.isOwnerBootstrapConfigured()) {
      Runtime.trap("Unauthorized: owner principal is not configured; bootstrap is disabled");
    };
    if (not AdminLib.isConfiguredOwner(caller)) {
      Runtime.trap("Unauthorized: caller is not the configured owner principal");
    };
    if (email != AdminLib.ownerEmail) {
      Runtime.trap("Unauthorized: email is not the configured owner");
    };
    AdminLib.claimOwner(admins, caller, ?email, Time.now().toNat());
  };

  /// Every admin. Admin only.
  public query ({ caller }) func listAdmins() : async [Types.Admin] {
    requireAdmin(caller);
    AdminLib.listAdmins(admins);
  };

  /// Grants admin access to `principal` with `role`. Owner only.
  public shared ({ caller }) func addAdmin(principal : Principal, role : Types.AdminRole) : async Bool {
    requireOwner(caller);
    AdminLib.addAdmin(admins, principal, null, role, Time.now().toNat());
  };

  /// Changes an admin's role. Owner only; the owner's own role cannot change.
  public shared ({ caller }) func setAdminRole(principal : Principal, role : Types.AdminRole) : async ?Types.Admin {
    requireOwner(caller);
    AdminLib.setAdminRole(admins, principal, role);
  };

  /// Revokes admin access from `principal`. Owner only; the owner cannot be
  /// removed.
  public shared ({ caller }) func removeAdmin(principal : Principal) : async Bool {
    requireOwner(caller);
    AdminLib.removeAdmin(admins, principal);
  };
};
