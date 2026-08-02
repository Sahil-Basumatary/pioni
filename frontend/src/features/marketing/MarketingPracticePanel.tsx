import { useMemo, useState } from "react";

const FEATURES = [
  {
    title: "See a practice path",
    body: "Pick a starting balance and timeframe to preview how paper funds can move with simple fills.",
  },
  {
    title: "Track the desk",
    body: "Balances, positions, and fills stay visible so you learn the real workflow.",
  },
  {
    title: "Reset when you need to",
    body: "Simulated funds can be reset. Nothing here is real money.",
  },
] as const;

const AMOUNTS = [1000, 5000, 10000] as const;
const MONTHS = [1, 3, 6, 12] as const;

export default function MarketingPracticePanel() {
  const [amount, setAmount] = useState<(typeof AMOUNTS)[number]>(10000);
  const [months, setMonths] = useState<(typeof MONTHS)[number]>(6);

  const projected = useMemo(() => {
    // Mild illustrative curve for presentation only — not a return promise.
    const growth = 1 + months * 0.012;
    return Math.round(amount * growth * 100) / 100;
  }, [amount, months]);

  const curve = useMemo(() => {
    const steps = 48;
    const vals: number[] = [];
    // Deterministic walk so the illustration is identical on every render.
    let seed = months * 7919;
    const noise = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648 - 0.5;
    };
    let drift = 0;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      drift = drift * 0.82 + noise() * 0.035;
      vals.push(amount * (1 + t * ((projected - amount) / amount) + drift * t));
    }
    vals[0] = amount;
    vals[steps] = projected;

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const pt = (v: number, i: number) => ({
      x: 10 + (i / steps) * 500,
      y: 150 - ((v - min) / span) * 112,
    });
    const coords = vals.map(pt);
    const line = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");
    const last = coords[coords.length - 1];
    return { line, area: `${line} L510 170 L10 170 Z`, last };
  }, [amount, months, projected]);

  return (
    <section
      id="practice"
      data-mkt="practice"
      className="mx-auto w-full max-w-7xl scroll-mt-32 px-4 py-16 sm:px-6 sm:py-24"
      aria-labelledby="mkt-practice-title"
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="flex flex-col gap-3">
          <h2
            id="mkt-practice-title"
            className="text-3xl font-normal tracking-tight text-[var(--text-primary)] sm:text-4xl sm:leading-[44px]"
          >
            Practice with a clear path
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            A simple paper preview — not a performance guarantee and not real returns.
          </p>
          {FEATURES.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]"
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-[var(--text-muted)]">
                Starting paper balance
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {AMOUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmount(n)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      amount === n
                        ? "bg-[var(--text-primary)] text-white"
                        : "border border-[var(--card-border)] text-[var(--text-primary)] hover:bg-black/[0.03]"
                    }`}
                  >
                    ${n.toLocaleString("en-US")}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--text-muted)]">Illustrative after</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                {projected.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
              </div>
            </div>
          </div>

          <svg viewBox="0 0 520 180" className="mt-6 h-48 w-full" aria-hidden>
            <defs>
              <linearGradient id="mkt-practice-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#101114" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#101114" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[8, 44, 80, 116, 152].map((y) => (
              <line
                key={y}
                x1="0"
                x2="520"
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-black/[0.07]"
              />
            ))}
            <path d={curve.area} fill="url(#mkt-practice-fill)" />
            <path
              d={curve.line}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="text-[var(--text-primary)]"
            />
            <circle
              cx={curve.last.x}
              cy={curve.last.y}
              r="4.5"
              fill="currentColor"
              className="text-[var(--text-primary)]"
            />
            <circle
              cx={curve.last.x}
              cy={curve.last.y}
              r="9"
              fill="currentColor"
              opacity="0.14"
              className="text-[var(--text-primary)]"
            />
          </svg>
          <div className="flex justify-between text-[10px] tabular-nums text-[var(--text-muted)]">
            <span>Today</span>
            <span>
              {months} month{months === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {MONTHS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  months === m
                    ? "bg-black/[0.08] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {m} month{m === 1 ? "" : "s"}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
            Illustration only for learning. Simulated funds. Not a forecast and not investment advice.
          </p>
        </div>
      </div>
    </section>
  );
}
