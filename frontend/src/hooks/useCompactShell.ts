import { useEffect, useState } from "react";

const COMPACT_QUERY = "(max-width: 639px)";

function matchesCompact(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(COMPACT_QUERY).matches;
}

export function useCompactShell(): boolean {
  const [compact, setCompact] = useState(matchesCompact);
  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);
  return compact;
}
