import { useMemo, useState } from "react";

const FEATURES = [
  {
    title: "Fills update your account",
    body: "Positions, orders, and history update when an order fills.",
  },
  {
    title: "Reset from Settings",
    body: "Clear your activity and restore the starting balance.",
  },
  {
    title: "Reset when you need to",
    body: "Resets are free and have no usage limit.",
  },
] as const;

const AMOUNTS = [1000, 5000, 10000] as const;
const MONTHS = [1, 3, 6, 12] as const;

const CHART = {
  width: 520,
  height: 180,
  left: 10,
  right: 470,
  top: 24,
  bottom: 148,
  base: 172,
} as const;

const AXIS_GUTTER = `${((CHART.width - CHART.right) / CHART.width) * 100}%`;

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

// Rounds a raw interval up to the nearest 1/2/5 x power of ten so axis labels
// land on readable values instead of the raw data range.
function niceStep(range: number, count: number) {
  const raw = range / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  const multiple =
    normalised >= 7.07 ? 10 : normalised >= 3.16 ? 5 : normalised >= 1.41 ? 2 : 1;
  return Math.max(1, multiple * magnitude);
}

export default function MarketingPracticePanel() {
  const [amount, setAmount] = useState<(typeof AMOUNTS)[number]>(10000);
  const [months, setMonths] = useState<(typeof MONTHS)[number]>(6);

  const projected = useMemo(() => {
    const growth = 1 + months * 0.012;
    return Math.round(amount * growth * 100) / 100;
  }, [amount, months]);

  const curve = useMemo(() => {
    const steps = 48;
    const vals: number[] = [];
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
    const toY = (v: number) =>
      CHART.bottom - ((v - min) / span) * (CHART.bottom - CHART.top);
    const coords = vals.map((v, i) => ({
      x: CHART.left + (i / steps) * (CHART.right - CHART.left),
      y: toY(v),
    }));
    const line = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");

    const step = niceStep(span, 4);
    const first = Math.ceil(min / step) * step;
    const ticks = Array.from(
      { length: Math.floor((max - first) / step) + 1 },
      (_, k) => {
        const value = first + k * step;
        return {
          value,
          y: toY(value),
          label: value.toLocaleString("en-US", { maximumFractionDigits: 0 }),
        };
      },
    );

    return {
      line,
      area: `${line} L${CHART.right} ${CHART.base} L${CHART.left} ${CHART.base} Z`,
      last: coords[coords.length - 1],
      ticks,
    };
  }, [amount, months, projected]);

  return (
    <section
      id="practice"
      data-mkt="practice"
      className="mx-auto w-full max-w-[1320px] scroll-mt-32 bg-[var(--mkt-ink-950)] px-4 py-10 sm:px-6"
      aria-labelledby="mkt-practice-title"
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-10">
        <div className="flex flex-col gap-2.5">
          <h2
            id="mkt-practice-title"
            className="text-2xl type-display font-medium text-[var(--text-primary)] sm:text-[28px] sm:leading-8"
          >
            A paper balance you can reset
          </h2>
          <p className="text-[14px] leading-relaxed text-[var(--text-muted)]">
            Pick a starting balance and time range. The chart is an example.
          </p>
          {FEATURES.map((item) => (
            <article
              key={item.title}
              data-mkt="practice-card"
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3.5 py-3 shadow-[var(--shadow-card)]"
            >
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)] sm:p-5">
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
                        ? "bg-[var(--mkt-cta-bg)] text-[var(--mkt-cta-fg)]"
                        : "border border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--mkt-hover)]"
                    }`}
                  >
                    ${n.toLocaleString("en-US")}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--text-muted)]">Example balance</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                {projected.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
              </div>
            </div>
          </div>

          <div className="relative mt-5 h-40 w-full" aria-hidden>
            <svg
              viewBox={`0 0 ${CHART.width} ${CHART.height}`}
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <defs>
                <linearGradient id="mkt-practice-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {curve.ticks.map((tick) => (
                <line
                  key={tick.value}
                  x1="0"
                  x2={CHART.right}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="text-white/[0.08]"
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
                vectorEffect="non-scaling-stroke"
                className="text-[var(--text-primary)]"
              />
            </svg>
            {curve.ticks.map((tick) => (
              <span
                key={tick.value}
                className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums text-[var(--text-muted)]"
                style={{ top: pct(tick.y, CHART.height) }}
              >
                {tick.label}
              </span>
            ))}
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--text-primary)]/[0.14] p-[4.5px]"
              style={{
                left: pct(curve.last.x, CHART.width),
                top: pct(curve.last.y, CHART.height),
              }}
            >
              <span className="block h-[9px] w-[9px] rounded-full bg-[var(--text-primary)]" />
            </span>
          </div>
          <div
            className="flex justify-between text-[10px] tabular-nums text-[var(--text-muted)]"
            style={{ paddingRight: AXIS_GUTTER }}
          >
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
                    ? "bg-white/[0.10] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {m} month{m === 1 ? "" : "s"}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
            Example only. Not a forecast or investment advice.
          </p>
        </div>
      </div>
    </section>
  );
}
