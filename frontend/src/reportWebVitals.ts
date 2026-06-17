import type { Metric } from "web-vitals";

export type WebVitalHandler = (metric: Metric) => void;

// web-vitals is loaded lazily so the library only enters a bundle when this
// helper is actually invoked, keeping it off the critical path.
export async function reportWebVitals(onReport: WebVitalHandler): Promise<void> {
  const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import("web-vitals");
  onCLS(onReport);
  onINP(onReport);
  onLCP(onReport);
  onFCP(onReport);
  onTTFB(onReport);
}

export function observeLongTasks(onLongTask: (entry: PerformanceEntry) => void): void {
  if (typeof PerformanceObserver === "undefined") return;
  if (!PerformanceObserver.supportedEntryTypes.includes("longtask")) return;

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(onLongTask);
  });
  observer.observe({ type: "longtask", buffered: true });
}
