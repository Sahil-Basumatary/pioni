import { useEffect, useState } from "react";

// Sections become "current" once their top clears the sticky chrome rather than
// when they merely intersect, so a tall section that scrolled past cannot win.
// Must stay just past the sections' scroll-mt-32 (128px) or an anchor jump lands
// one section short of highlighting its own link.
const ACTIVATION_OFFSET = 140;

export function useActiveSection(ids: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const targets = ids
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => element !== null);
      if (!targets.length) return;

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveId(targets[targets.length - 1].id);
        return;
      }

      let current = targets[0].id;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= ACTIVATION_OFFSET) current = target.id;
      }
      setActiveId(current);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids]);

  return activeId;
}
