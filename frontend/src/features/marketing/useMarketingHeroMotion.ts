import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";

const ENTRANCE =
  "[data-mkt='header'], [data-mkt='subnav'], [data-mkt='eyebrow'], [data-mkt='title'], [data-mkt='lede'], [data-mkt='ctas'], [data-mkt='disclaimer'], [data-mkt='hero-media']";

const SCROLL_SECTIONS =
  "[data-mkt='highlights'], [data-mkt='how'], [data-mkt='float-markets'], [data-mkt='practice'], [data-mkt='desk-gallery'], [data-mkt='faq'], [data-mkt='closing'], [data-mkt='footer']";

export function useMarketingHeroMotion(rootRef: RefObject<HTMLElement | null>) {
  const played = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || played.current) return;
    played.current = true;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const entrance = root.querySelectorAll<HTMLElement>(ENTRANCE);
    const sections = root.querySelectorAll<HTMLElement>(SCROLL_SECTIONS);

    if (reduce) {
      gsap.set([...entrance, ...sections], { clearProps: "all", opacity: 1, y: 0 });
      return;
    }

    gsap.set(entrance, { opacity: 0, y: 16 });
    gsap.set(sections, { opacity: 0, y: 28 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(root.querySelectorAll("[data-mkt='header']"), { opacity: 1, y: 0, duration: 0.4 }, 0)
      .to(root.querySelectorAll("[data-mkt='subnav']"), { opacity: 1, y: 0, duration: 0.35 }, 0.05)
      .to(root.querySelectorAll("[data-mkt='eyebrow']"), { opacity: 1, y: 0, duration: 0.35 }, 0.1)
      .to(root.querySelectorAll("[data-mkt='title']"), { opacity: 1, y: 0, duration: 0.45 }, 0.16)
      .to(root.querySelectorAll("[data-mkt='lede']"), { opacity: 1, y: 0, duration: 0.4 }, 0.24)
      .to(root.querySelectorAll("[data-mkt='ctas']"), { opacity: 1, y: 0, duration: 0.35 }, 0.32)
      .to(root.querySelectorAll("[data-mkt='disclaimer']"), { opacity: 1, y: 0, duration: 0.3 }, 0.38)
      .to(root.querySelectorAll("[data-mkt='hero-media']"), { opacity: 1, y: 0, duration: 0.5 }, 0.28);

    const observers: IntersectionObserver[] = [];
    sections.forEach((section) => {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            gsap.to(section, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" });
            io.disconnect();
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
      );
      io.observe(section);
      observers.push(io);
    });

    return () => {
      tl.kill();
      observers.forEach((io) => io.disconnect());
    };
  }, [rootRef]);
}
