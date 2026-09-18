import { Link } from "react-router-dom";

import { OvaniteWordmark } from "@/components/brand/OvaniteMark";
import { Container } from "@/components/layout/Container";
import { useSiteContent } from "@/hooks/useSiteContent";

const FOOTER_NAV = [
  { label: "Products", to: "/products" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Waitlist", to: "/waitlist" },
] as const;

// The footer Navigate group mirrors the primary navigation exactly.

const LEGAL_NAV = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
] as const;

export function Footer() {
  const { data: content } = useSiteContent();
  const year = new Date().getFullYear();
  const footerText =
    content?.footerText ??
    "Ovanite builds software products designed to matter — precise, durable, and made for the long term.";

  return (
    <footer className="border-t border-border bg-ink text-ink-foreground">
      <Container>
        <div className="grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-5">
            <OvaniteWordmark
              markClassName="text-ink-foreground"
              textClassName="text-ink-foreground"
            />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-foreground/70">
              {footerText}
            </p>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <h2 className="eyebrow text-ink-foreground/60">Navigate</h2>
            <ul className="mt-5 space-y-3">
              {FOOTER_NAV.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    data-ocid={`footer.${link.label.toLowerCase()}_link`}
                    className="rounded-sm text-sm text-ink-foreground/80 transition-colors hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="md:col-span-2">
            <h2 className="eyebrow text-ink-foreground/60">Legal</h2>
            <ul className="mt-5 space-y-3">
              {LEGAL_NAV.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    data-ocid={`footer.${link.label.toLowerCase()}_link`}
                    className="rounded-sm text-sm text-ink-foreground/80 transition-colors hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <h2 className="eyebrow text-ink-foreground/60">Contact</h2>
            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  to="/contact"
                  data-ocid="footer.contact_link"
                  className="rounded-sm text-sm text-ink-foreground/80 transition-colors hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  Start a conversation
                </Link>
              </li>
              <li>
                <Link
                  to="/waitlist"
                  data-ocid="footer.waitlist_link"
                  className="rounded-sm text-sm text-ink-foreground/80 transition-colors hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  Join the waitlist
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-ink-foreground/15 py-8 text-xs text-ink-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono uppercase tracking-[0.16em]">
            © {year} Ovanite. All rights reserved.
          </p>
          <p>
            © {year}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm underline underline-offset-4 transition-colors hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
