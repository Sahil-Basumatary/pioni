import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";

const ENTRANCE =
  "[data-mkt='header'], [data-mkt='eyebrow'], [data-mkt='title'], [data-mkt='lede'], [data-mkt='ctas'], [data-mkt='disclaimer'], [data-mkt='hero-media'], [data-mkt='board'] [data-mkt='card']";

const SCROLL_SECTIONS =
  "[data-mkt='how'], [data-mkt='proof'], [data-mkt='trust'], [data-mkt='footer']";

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
    tl.to(root.querySelectorAll("[data-mkt='header']"), {
      opacity: 1,
      y: 0,
      duration: 0.45,
    }, 0)
      .to(root.querySelectorAll("[data-mkt='eyebrow']"), {
        opacity: 1,
        y: 0,
        duration: 0.4,
      }, 0.08)
      .to(root.querySelectorAll("[data-mkt='title']"), {
        opacity: 1,
        y: 0,
        duration: 0.5,
      }, 0.14)
      .to(root.querySelectorAll("[data-mkt='lede']"), {
        opacity: 1,
        y: 0,
        duration: 0.45,
      }, 0.22)
      .to(root.querySelectorAll("[data-mkt='ctas']"), {
        opacity: 1,
        y: 0,
        duration: 0.4,
      }, 0.3)
      .to(root.querySelectorAll("[data-mkt='disclaimer']"), {
        opacity: 1,
        y: 0,
        duration: 0.35,
      }, 0.36)
      .to(root.querySelectorAll("[data-mkt='hero-media']"), {
        opacity: 1,
        y: 0,
        duration: 0.55,
      }, 0.28)
      .to(root.querySelectorAll("[data-mkt='board'] [data-mkt='card']"), {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.05,
      }, 0.42);

    const observers: IntersectionObserver[] = [];
    sections.forEach((section) => {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            gsap.to(section, {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: "power3.out",
            });
            io.disconnect();
          });
        },
        { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
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
