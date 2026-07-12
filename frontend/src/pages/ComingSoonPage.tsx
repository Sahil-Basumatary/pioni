import { Link } from "react-router-dom";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export default function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-start justify-center gap-4 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
        Coming soon
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        {title}
      </h1>
      <p className="max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
      <Link
        to="/trading"
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
      >
        Go to Spot trading
      </Link>
    </div>
  );
}
