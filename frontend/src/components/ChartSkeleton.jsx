export default function ChartSkeleton() {
  return (
    <div className="w-full h-64 relative overflow-hidden rounded-xl bg-[var(--card-bg)] skeleton-chart">
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-[0.15]">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="border border-black/5"></div>
        ))}
      </div>
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="0,25 20,10 40,30 60,15 80,28 100,12"
        />
      </svg>
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}

