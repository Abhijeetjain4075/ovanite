import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/admin";

module {
  /// The exact Internet Identity principal authorized to bootstrap ownership.
  ///
  /// IMPORTANT: null is the secure default and deliberately disables owner
  /// bootstrap. Set this to the verified operator principal before deploying
  /// the backend. Never authorize ownership using a caller-supplied email:
  /// Internet Identity does not cryptographically bind that text to the caller.
  public let ownerPrincipal : ?Principal = null;

  /// Email is retained only as a secondary operator-facing consistency check.
  /// It is NOT an authentication factor and must never authorize ownership.
  public let ownerEmail : Text = "therealabhijeetjain@gmail.com";

  /// True only when an operator principal has been explicitly configured.
  public func isOwnerBootstrapConfigured() : Bool {
    switch (ownerPrincipal) {
      case null { false };
      case (?_) { true };
    };
  };

  /// True only when principal matches the explicitly configured owner.
  public func isConfiguredOwner(principal : Principal) : Bool {
    switch (ownerPrincipal) {
      case null { false };
      case (?expected) { Principal.equal(expected, principal) };
    };
  };

  /// Returns every admin, owner first then by `addedAt`.
  public func listAdmins(admins : Map.Map<Principal, Types.Admin>) : [Types.Admin] {
    let all = admins.values().toArray();
    all.sort(func(a, b) {
      if (a.isOwner and not b.isOwner) { #less }
      else if (b.isOwner and not a.isOwner) { #greater }
      else if (a.addedAt < b.addedAt) { #less }
      else if (a.addedAt > b.addedAt) { #greater }
      else { #equal };
    });
  };

  /// Returns the admin record for `principal`, if any.
  public func getAdmin(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
  ) : ?Types.Admin {
    admins.get(principal);
  };

  /// Returns whether the `admins` map is empty (no owner has claimed yet).
  public func isEmpty(admins : Map.Map<Principal, Types.Admin>) : Bool {
    admins.size() == 0;
  };

  /// Records a non-owner admin with `role`. The special `#owner` role is
  /// reserved for the one-time owner bootstrap and can never be delegated.
  /// Returns `false` when the principal already exists or `role == #owner`.
  public func addAdmin(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
    email : ?Text,
    role : Types.AdminRole,
    now : Nat,
  ) : Bool {
    if (role == #owner) { return false };
    switch (admins.get(principal)) {
      case (?_) { false };
      case null {
        admins.add(principal, {
          principal;
          email;
          isOwner = false;
          role;
          addedAt = now;
        });
        true;
      };
    };
  };

  /// Records only the explicitly preconfigured owner principal. Returns false
  /// when bootstrap is unconfigured, the caller is not the configured owner,
  /// or an owner/admin record already exists.
  public func claimOwner(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
    email : ?Text,
    now : Nat,
  ) : Bool {
    if (not isEmpty(admins)) { return false };
    if (not isConfiguredOwner(principal)) { return false };
    switch (admins.get(principal)) {
      case (?_) { false };
      case null {
        admins.add(principal, {
          principal;
          email;
          isOwner = true;
          role = #owner;
          addedAt = now;
        });
        true;
      };
    };
  };

  /// Removes an admin. Refuses to remove the owner. Returns whether a record
  /// was removed.
  public func removeAdmin(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
  ) : Bool {
    switch (admins.get(principal)) {
      case null { false };
      case (?existing) {
        if (existing.isOwner) { false } else {
          admins.remove(principal);
          true;
        };
      };
    };
  };

  /// Changes an admin's role. Refuses to change the owner's role. Returns the
  /// updated record, or `null` when the principal is not an admin or is the
  /// owner.
  public func setAdminRole(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
    role : Types.AdminRole,
  ) : ?Types.Admin {
    switch (admins.get(principal)) {
      case null { null };
      case (?existing) {
        // Owner is a unique authority, not a role that can be assigned to
        // another admin. Reject both demoting the owner and promoting anyone
        // else to the special owner role.
        if (existing.isOwner or role == #owner) { null } else {
          let updated : Types.Admin = {
            principal = existing.principal;
            email = existing.email;
            isOwner = existing.isOwner;
            role;
            addedAt = existing.addedAt;
          };
          admins.add(principal, updated);
          ?updated;
        };
      };
    };
  };

  /// Returns whether `principal` is a registered admin.
  /// Registration permits protected reads; write permission is checked
  /// separately so `#viewer` remains read-only.
  public func isAdmin(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
  ) : Bool {
    switch (admins.get(principal)) {
      case (?_) { true };
      case null { false };
    };
  };

  /// Returns whether a principal may mutate site content or submissions.
  /// The unique owner can write; among delegated admins, only `#editor` can.
  public func canEditContent(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
  ) : Bool {
    switch (admins.get(principal)) {
      case (?existing) { existing.isOwner or existing.role == #editor };
      case null { false };
    };
  };

  /// Returns whether `principal` is the owner.
  public func isOwner(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
  ) : Bool {
    switch (admins.get(principal)) {
      case (?existing) { existing.isOwner };
      case null { false };
    };
  };
};
