import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LEGAL } from "./legalConfig";

type LegalLayoutProps = {
  title: string;
  summary: ReactNode;
  children: ReactNode;
};

export default function LegalLayout({ title, summary, children }: LegalLayoutProps) {
  return (
    <div className="mx-auto max-w-[980px] py-2">
      <header className="mb-8">
        <div
          className="bg-black text-white"
          style={{ width: "100vw", marginLeft: "calc(50% - 50vw)", marginTop: "-2.5rem" }}
        >
          <div className="mx-auto max-w-[1320px] px-6 lg:px-12">
            <div className="mx-auto flex min-h-[300px] max-w-[980px] flex-col justify-center py-16">
              <p className="text-sm text-white/80">Legal</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            </div>
          </div>
        </div>
        <p className="mt-8 text-sm italic text-[var(--text-muted)]">
          Last updated: {LEGAL.lastUpdated}
        </p>
        <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-tertiary,rgba(0,0,0,0.02))] px-4 py-3 text-sm text-[var(--text-secondary)]">
          {summary}
        </div>
      </header>
      <div className="legal-prose">{children}</div>
      <footer className="mt-12 border-t border-[var(--card-border)] pt-6 text-sm text-[var(--text-muted)]">
        Questions about this document? Email{" "}
        <a className="underline" href={`mailto:${LEGAL.contactEmail}`}>
          {LEGAL.contactEmail}
        </a>
        . See also our <NavLink className="underline" to="/terms">Terms of Service</NavLink> and{" "}
        <NavLink className="underline" to="/privacy">Privacy Policy</NavLink>.
      </footer>
    </div>
  );
}
