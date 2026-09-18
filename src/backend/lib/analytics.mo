import Map "mo:core/Map";
import Char "mo:core/Char";
import Types "../types/analytics";

module {
  /// Maximum accepted length of a normalized route path, in characters.
  public let maxPathLength : Nat = 128;

  /// Normalizes and validates a raw route path.
  ///
  /// Returns the canonical path when it is a countable public route, or `null`
  /// when it must not be counted. The rules are deliberately conservative so
  /// arbitrary caller input cannot create unbounded state:
  ///
  /// - surrounding whitespace is trimmed;
  /// - the path must start with `/`;
  /// - a query string (`?`) or fragment (`#`) is stripped;
  /// - duplicate slashes are collapsed;
  /// - a trailing slash (other than the root `/`) is removed;
  /// - the path must be non-empty and at most `maxPathLength` characters;
  /// - admin routes (any path under `/admin`) are rejected.
  public func normalizePath(raw : Text) : ?Types.RoutePath {
    // Trim surrounding whitespace.
    let trimmed = raw.trim(#predicate(func c = c == ' ' or c == '\t' or c == '\n' or c == '\r'));

    // Strip query string and fragment.
    let withoutQuery = switch (trimmed.split(#char '?').next()) {
      case (?head) { head };
      case null { trimmed };
    };
    let withoutFragment = switch (withoutQuery.split(#char '#').next()) {
      case (?head) { head };
      case null { withoutQuery };
    };

    // Must be an absolute path.
    if (not withoutFragment.startsWith(#char '/')) {
      return null;
    };

    // Collapse duplicate slashes.
    var collapsed = "";
    var previousSlash = false;
    for (c in withoutFragment.chars()) {
      if (c == '/') {
        if (not previousSlash) {
          collapsed := collapsed # "/";
        };
        previousSlash := true;
      } else {
        collapsed := collapsed # c.toText();
        previousSlash := false;
      };
    };

    // Remove a trailing slash other than the root path.
    if (collapsed.size() > 1 and collapsed.endsWith(#char '/')) {
      collapsed := collapsed.stripEnd(#char '/') ?? collapsed;
    };

    // Reject empty, over-long, and admin paths.
    if (collapsed.size() == 0 or collapsed.size() > maxPathLength) {
      return null;
    };
    if (collapsed == "/admin" or collapsed.startsWith(#text "/admin/")) {
      return null;
    };

    ?collapsed;
  };

  /// Records one view of `raw` and returns the outcome.
  ///
  /// The counter is additive: a valid path increments its aggregate total by
  /// exactly one, so repeated calls are safe and never create per-visitor rows.
  /// An invalid or admin path is ignored and stores nothing.
  public func recordView(
    views : Map.Map<Types.RoutePath, Types.RouteViews>,
    raw : Text,
    now : Types.Timestamp,
  ) : Types.RecordViewResult {
    let path = switch (normalizePath(raw)) {
      case (?p) { p };
      case null { return #ignored };
    };

    let updated = switch (views.get(path)) {
      case (?existing) {
        {
          path = existing.path;
          views = existing.views + 1;
          firstSeenAt = existing.firstSeenAt;
          lastSeenAt = now;
        };
      };
      case null {
        {
          path;
          views = 1;
          firstSeenAt = now;
          lastSeenAt = now;
        };
      };
    };

    views.add(path, updated);
    #recorded(updated);
  };

  /// Returns the aggregate total for a normalized path, or `null` when the
  /// path has never been recorded.
  public func getViews(
    views : Map.Map<Types.RoutePath, Types.RouteViews>,
    raw : Text,
  ) : ?Types.RouteViews {
    switch (normalizePath(raw)) {
      case (?path) { views.get(path) };
      case null { null };
    };
  };

  /// Returns every recorded route with its aggregate total, ordered by path.
  public func listViews(
    views : Map.Map<Types.RoutePath, Types.RouteViews>,
  ) : [Types.RouteViews] {
    views.values().toArray();
  };
};
