import { useLocation } from "wouter";
import { ArrowUpRight, ClipboardCheck, FilePlus2, FileText, LayoutDashboard, ListChecks, LogOut, ShieldCheck } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const participantNav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/my-submissions", label: "My submissions", icon: ListChecks },
  { href: "/submit", label: "Submit a project", icon: FilePlus2 },
];
const staffNav = [
  { href: "/admin/submissions", label: "Submission queue", icon: ClipboardCheck },
  { href: "/admin/evaluations", label: "Evaluations", icon: ShieldCheck },
  { href: "/admin/terms", label: "Program terms", icon: FileText },
];

function Brand() {
  return (
    <a href="/" className="brand-lockup" aria-label="Ovanite portal home">
      <span className="brand-mark" aria-hidden="true"><span /></span>
      <span className="brand-name">ovanite<span className="brand-period">.</span></span>
    </a>
  );
}

function LoginGate({ error }: { error?: boolean }) {
  return (
    <div className="gate-page">
      <div className="gate-grid" aria-hidden="true" />
      <header className="gate-header"><Brand /><span className="mono eyebrow">PARTICIPANT PORTAL / 01</span></header>
      <main className="gate-content">
        <p className="eyebrow accent-label"><span className="marker" /> SOFTWARE, BUILT TO MATTER.</p>
        <h1>Good software starts with a real problem.</h1>
        <p className="gate-copy">Submit what you have built, share the evidence, and follow each review step in one private workspace.</p>
        {error && <p className="inline-error" role="alert">We could not verify your session. Sign in again to continue.</p>}
        <button className="button button-primary" onClick={() => startLogin()} type="button">Sign in to the portal <ArrowUpRight size={16} /></button>
        <div className="privacy-note"><ShieldCheck size={17} /><span>Submissions are visible only to you and authorized Ovanite reviewers.</span></div>
      </main>
      <footer className="gate-footer"><span>Software, built to matter.</span><span className="mono">OVANITE / SUBMISSIONS</span></footer>
    </div>
  );
}

function SessionLoading() {
  return <div className="session-loading" role="status" aria-live="polite"><span className="loading-line" />Checking secure session…</div>;
}

function AccessDenied() {
  return <div className="gate-page"><div className="gate-grid" aria-hidden="true" /><header className="gate-header"><Brand /><span className="mono eyebrow">OVANITE / ACCESS CONTROL</span></header><main className="gate-content"><p className="eyebrow accent-label"><span className="marker" /> PRIVATE REVIEW WORKSPACE</p><h1>This workspace is restricted.</h1><p className="gate-copy">Your account does not have an Ovanite staff review role. Your participant records remain available from your own workspace.</p><a className="button button-primary" href="/">Return to my workspace <ArrowUpRight size={16} /></a></main><footer className="gate-footer"><span>Software, built to matter.</span><span className="mono">ACCESS DENIED / 403</span></footer></div>;
}

export default function PortalShell({ children, staffOnly = false }: { children: React.ReactNode; staffOnly?: boolean }) {
  const { user, loading, error, logout } = useAuth();
  const [path] = useLocation();
  if (loading) return <SessionLoading />;
  if (!user) return <LoginGate error={Boolean(error)} />;

  const role = user.portalRole ?? "participant";
  const isStaff = role !== "participant";
  if (staffOnly && !isStaff) return <AccessDenied />;
  const initials = (user.name || user.email || "O").split(/[\s@]+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");

  return (
    <div className="portal-layout">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="portal-sidebar" aria-label="Portal navigation">
        <Brand />
        <div className="sidebar-divider" />
        <p className="mono nav-caption">WORKSPACE</p>
        <nav className="side-nav">
          {participantNav.map(item => {
            const Icon = item.icon;
            const active = item.href === "/" ? path === "/" : path === item.href || path.startsWith(`${item.href}/`);
            return <a key={item.href} className={`nav-link ${active ? "is-active" : ""}`} href={item.href} aria-current={active ? "page" : undefined}><Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{active && <span className="nav-indicator" />}</a>;
          })}
        </nav>
        {isStaff && <>
          <div className="sidebar-divider staff-divider" />
          <p className="mono nav-caption">OVANITE REVIEW</p>
          <nav className="side-nav">
            {staffNav.map(item => {
              const Icon = item.icon;
              const active = path === item.href || path.startsWith(`${item.href}/`);
              return <a key={item.href} className={`nav-link ${active ? "is-active" : ""}`} href={item.href} aria-current={active ? "page" : undefined}><Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{active && <span className="nav-indicator" />}</a>;
            })}
          </nav>
        </>}
        <div className="sidebar-spacer" />
        <div className="sidebar-footer"><span className="mono">PRIVATE WORKSPACE</span><span className="sidebar-status"><i /> Secure session</span></div>
      </aside>
      <div className="portal-main-column">
        <header className="portal-topbar">
          <div className="topbar-context"><span className="context-dot" />{staffOnly ? "REVIEW WORKSPACE" : "PARTICIPANT WORKSPACE"}<span className="mono context-divider">/</span><span className="tagline-mini">Software, built to matter.</span></div>
          <div className="topbar-user"><span className="user-avatar" aria-hidden="true">{initials || "O"}</span><span className="user-name">{user.name || user.email || "Account"}</span><span className="role-chip">{role.replace("_", " ")}</span><button className="icon-button signout-button" onClick={() => void logout()} aria-label="Sign out"><LogOut size={16} /></button></div>
        </header>
        <main id="main-content" className="portal-main">{children}</main>
        <footer className="portal-footer"><span>Ovanite <span className="brand-period">/</span> “Software, built to matter.”</span><span className="mono">PRIVATE BY DESIGN · {isStaff ? "STAFF REVIEW" : "PARTICIPANT"}</span></footer>
      </div>
    </div>
  );
}
