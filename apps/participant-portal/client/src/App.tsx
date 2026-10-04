import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import PortalShell from "./components/PortalShell";
import { ThemeProvider } from "./contexts/ThemeContext";

const PortalHome = lazy(() => import("./pages/PortalHome"));
const SubmitPage = lazy(() => import("./pages/SubmitPage"));
const MySubmissionsPage = lazy(() => import("./pages/MySubmissionsPage"));
const SubmissionDetailPage = lazy(() => import("./pages/SubmissionDetailPage"));
const AdminQueuePage = lazy(() => import("./pages/admin/AdminQueuePage"));
const AdminSubmissionPage = lazy(() => import("./pages/admin/AdminSubmissionPage"));
const EvaluationsPage = lazy(() => import("./pages/admin/EvaluationsPage"));
const TermsPage = lazy(() => import("./pages/admin/TermsPage"));

function Router() {
  return (
    <Suspense fallback={<div className="page-wrap"><div className="loading-panel" role="status" aria-live="polite"><span className="loading-line" />Loading Ovanite portal…</div></div>}>
      <Switch>
        <Route path="/admin/submissions/:id" component={AdminSubmissionRoute} />
        <Route path="/submission/:id" component={SubmissionDetailRoute} />
        <Route path="/admin/submissions" component={AdminQueueRoute} />
        <Route path="/admin/evaluations" component={EvaluationsRoute} />
        <Route path="/admin/terms" component={TermsRoute} />
        <Route path="/submit" component={SubmitRoute} />
        <Route path="/my-submissions" component={MySubmissionsRoute} />
        <Route path="/" component={PortalHomeRoute} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function PortalHomeRoute() { return <PortalShell><PortalHome /></PortalShell>; }
function SubmitRoute() { return <PortalShell><SubmitPage /></PortalShell>; }
function MySubmissionsRoute() { return <PortalShell><MySubmissionsPage /></PortalShell>; }
function SubmissionDetailRoute() { return <PortalShell><SubmissionDetailPage /></PortalShell>; }
function AdminQueueRoute() { return <PortalShell staffOnly><AdminQueuePage /></PortalShell>; }
function AdminSubmissionRoute() { return <PortalShell staffOnly><AdminSubmissionPage /></PortalShell>; }
function EvaluationsRoute() { return <PortalShell staffOnly><EvaluationsPage /></PortalShell>; }
function TermsRoute() { return <PortalShell staffOnly><TermsPage /></PortalShell>; }

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
