import type { ReactNode } from "react";

type DocLayoutProps = {
  eyebrow: string;
  title: string;
  meta?: ReactNode;
  summary: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export default function DocLayout({
  eyebrow,
  title,
  meta,
  summary,
  children,
  footer,
}: DocLayoutProps) {
  return (
    <div className="mx-auto max-w-[980px] py-2">
      <header className="mb-8">
        <div
          className="bg-black text-white"
          style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}
        >
          <div className="mx-auto max-w-[1320px] px-6 lg:px-12">
            <div className="mx-auto flex min-h-[300px] max-w-[980px] flex-col justify-center py-16">
              <p className="text-sm text-white/80">{eyebrow}</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            </div>
          </div>
        </div>
        {meta ? (
          <p className="mt-8 text-sm italic text-[var(--text-muted)]">{meta}</p>
        ) : null}
        <div
          className={`${meta ? "mt-4" : "mt-8"} rounded-xl border border-[var(--card-border)] bg-[var(--bg-tertiary,rgba(0,0,0,0.02))] px-4 py-3 text-sm text-[var(--text-secondary)]`}
        >
          {summary}
        </div>
      </header>
      <div className="legal-prose">{children}</div>
      {footer ? (
        <footer className="mt-12 border-t border-[var(--card-border)] pt-6 text-sm text-[var(--text-muted)]">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
