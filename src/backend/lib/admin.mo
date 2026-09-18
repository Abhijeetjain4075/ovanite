import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/admin";

module {
  /// The email that is allowed to claim ownership of this deployment.
  ///
  /// The backend cannot read an email from Internet Identity, so ownership is
  /// bootstrapped by a one-time claim: the first caller to present this exact
  /// email while the `admins` map is empty becomes the owner. Once an owner
  /// exists the claim path is closed forever and no caller can self-grant.
  public let ownerEmail : Text = "therealabhijeetjain@gmail.com";

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

  /// Records `principal` as an admin with `role`. Returns `false` when the
  /// principal is already an admin.
  public func addAdmin(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
    email : ?Text,
    role : Types.AdminRole,
    now : Nat,
  ) : Bool {
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

  /// Records `principal` as the owner. Only valid while the map is empty.
  /// Returns `false` when an owner already exists or the principal is already
  /// present.
  public func claimOwner(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
    email : ?Text,
    now : Nat,
  ) : Bool {
    if (not isEmpty(admins)) { return false };
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
        if (existing.isOwner) { null } else {
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

  /// Returns whether `principal` is an admin.
  public func isAdmin(
    admins : Map.Map<Principal, Types.Admin>,
    principal : Principal,
  ) : Bool {
    switch (admins.get(principal)) {
      case (?_) { true };
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
