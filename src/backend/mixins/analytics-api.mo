import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/analytics";
import AdminTypes "../types/admin";
import AdminLib "../lib/admin";
import AnalyticsLib "../lib/analytics";
import AnalyticsPolicy "../lib/analytics-policy";

mixin (
  views : Map.Map<Types.RoutePath, Types.RouteViews>,
  admins : Map.Map<Principal, AdminTypes.Admin>,
) {
  /// Aggregate traffic per route is operational data, not public content: it
  /// reveals which internal paths exist and how much attention each receives.
  /// Reads therefore require a registered admin (owner, editor or viewer).
  func requireAnalyticsAdmin(caller : Principal) {
    if (not AdminLib.isAdmin(admins, caller)) {
      Runtime.trap("Unauthorized: admin access required");
    };
  };
  /// The browser's consent banner is a usability/privacy control, not a
  /// canister authorization boundary. poka-yoke: prevent direct public update
  /// calls from creating arbitrary persistent route keys or consuming cycles
  /// until server-side abuse and cost controls are designed and verified.
  func requirePublicAnalyticsWritesEnabled() {
    if (not AnalyticsPolicy.publicAnalyticsWritesEnabled) {
      Runtime.trap("Public analytics writes are disabled by backend release policy");
    };
  };

  /// Records one aggregate view only after a deliberate server-side release.
  /// Currently closed: callers can bypass frontend consent and invoke canisters
  /// directly, so consent alone cannot protect state size or cycle consumption.
  public shared func recordPageView(path : Text) : async Types.RecordViewResult {
    requirePublicAnalyticsWritesEnabled();
    AnalyticsLib.recordView(views, path, Time.now().toNat());
  };

  /// Returns the aggregate view total for a single route, or `null` when the
  /// route has never been recorded. Admin only.
  public query ({ caller }) func getPageViews(path : Text) : async ?Types.RouteViews {
    requireAnalyticsAdmin(caller);
    AnalyticsLib.getViews(views, path);
  };

  /// Returns every recorded route with its aggregate total, ordered by path.
  /// Admin only.
  public query ({ caller }) func listPageViews() : async [Types.RouteViews] {
    requireAnalyticsAdmin(caller);
    AnalyticsLib.listViews(views);
  };
};
