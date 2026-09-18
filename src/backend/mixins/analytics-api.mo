import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/analytics";
import AnalyticsLib "../lib/analytics";

mixin (views : Map.Map<Types.RoutePath, Types.RouteViews>) {
  /// Records one view of a public route. Callable by anyone, including
  /// anonymous callers, because the frontend only calls it after the visitor
  /// has consented to analytics.
  ///
  /// The path is normalized and validated by the backend; an invalid path or an
  /// admin route is ignored and stores nothing. The counter is additive and
  /// stores only an aggregate total — no IP, user agent, principal, or session
  /// identifier is ever read or stored.
  public shared func recordPageView(path : Text) : async Types.RecordViewResult {
    AnalyticsLib.recordView(views, path, Time.now().toNat());
  };

  /// Returns the aggregate view total for a single route, or `null` when the
  /// route has never been recorded.
  public query func getPageViews(path : Text) : async ?Types.RouteViews {
    AnalyticsLib.getViews(views, path);
  };

  /// Returns every recorded route with its aggregate total, ordered by path.
  public query func listPageViews() : async [Types.RouteViews] {
    AnalyticsLib.listViews(views);
  };
};
