import Common "common";

module {
  public type Timestamp = Common.Timestamp;

  /// A normalized public route path, e.g. `/`, `/products`, `/about`.
  /// Always starts with `/`, never contains a query string or fragment, and is
  /// bounded in length so arbitrary input cannot bloat state.
  public type RoutePath = Text;

  /// Aggregate view count for a single public route. Stores only a total —
  /// never a per-visitor, per-session, or per-principal record.
  public type RouteViews = {
    path : RoutePath;
    views : Nat;
    firstSeenAt : Timestamp;
    lastSeenAt : Timestamp;
  };

  /// Result of recording a view. `#recorded` means the aggregate total was
  /// incremented; `#ignored` means the path was rejected (empty, malformed,
  /// over-long, or an admin route) and nothing was stored.
  public type RecordViewResult = {
    #recorded : RouteViews;
    #ignored;
  };
};
