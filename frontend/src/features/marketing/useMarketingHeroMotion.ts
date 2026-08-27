import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ENTRANCE =
  "[data-mkt='header'], [data-mkt='subnav'], [data-mkt='eyebrow'], [data-mkt='title'], [data-mkt='lede'], [data-mkt='ctas'], [data-mkt='category-rail'], [data-mkt='featured'], [data-mkt='integrity'], [data-mkt='side-rails']";

const REVEALS: { section: string; items?: string }[] = [
  { section: "[data-mkt='float-markets']", items: "[data-mkt='market-card']" },
  { section: "[data-mkt='category-sections']" },
  { section: "[data-mkt='practice']", items: "[data-mkt='practice-card']" },
  { section: "[data-mkt='desk-gallery']", items: ".marketing-desk-gallery__cell" },
  { section: "[data-mkt='coverage']", items: "[data-mkt='coverage-stat']" },
  { section: "[data-mkt='app-showcase']" },
  { section: "[data-mkt='faq']", items: "[data-mkt='faq-item']" },
  { section: "[data-mkt='closing']" },
  { section: "[data-mkt='browse-index']" },
  { section: "[data-mkt='footer']" },
];

const SECTION_SELECTOR = REVEALS.map((reveal) => reveal.section).join(", ");

const RESET_SELECTOR = [
  ENTRANCE,
  SECTION_SELECTOR,
  "[data-mkt='hero-copy']",
  "[data-mkt='featured-card']",
  "[data-mkt='hub-card']",
  "[data-mkt='side-row']",
  "[data-mkt='market-card']",
  "[data-mkt='practice-card']",
  ".marketing-desk-gallery__cell",
  "[data-mkt='coverage-stat']",
  "[data-mkt='faq-item']",
  ".marketing-phone",
  ".marketing-laptop",
  "main h2",
].join(", ");

export function useMarketingHeroMotion(
  rootRef: RefObject<HTMLElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(root.querySelectorAll(RESET_SELECTOR), {
        clearProps: "all",
        opacity: 1,
        y: 0,
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const entrance = root.querySelectorAll<HTMLElement>(ENTRANCE);
      gsap.set(entrance, { opacity: 0, y: 18 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to("[data-mkt='header']", { opacity: 1, y: 0, duration: 0.4 }, 0)
        .to("[data-mkt='subnav']", { opacity: 1, y: 0, duration: 0.35 }, 0.04)
        .to("[data-mkt='eyebrow']", { opacity: 1, y: 0, duration: 0.35 }, 0.08)
        .to("[data-mkt='title']", { opacity: 1, y: 0, duration: 0.55 }, 0.12)
        .to("[data-mkt='lede']", { opacity: 1, y: 0, duration: 0.45 }, 0.2)
        .to("[data-mkt='ctas']", { opacity: 1, y: 0, duration: 0.4 }, 0.28)
        .to("[data-mkt='category-rail']", { opacity: 1, y: 0, duration: 0.4 }, 0.3)
        .to("[data-mkt='featured']", { opacity: 1, y: 0, duration: 0.55 }, 0.36)
        .to("[data-mkt='integrity']", { opacity: 1, y: 0, duration: 0.45 }, 0.44)
        .to("[data-mkt='side-rails']", { opacity: 1, y: 0, duration: 0.55 }, 0.4);

      REVEALS.forEach(({ section, items }) => {
        const target = root.querySelector<HTMLElement>(section);
        if (!target) return;
        const cards = items ? target.querySelectorAll<HTMLElement>(items) : [];

        gsap.set(target, { opacity: 0, y: 40 });
        if (cards.length) gsap.set(cards, { opacity: 0, y: 28, scale: 0.96 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: target, start: "top 90%", once: true },
          defaults: { ease: "power3.out" },
        });
        tl.to(target, { opacity: 1, y: 0, duration: 0.6 }, 0);
        if (cards.length) {
          tl.to(
            cards,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.55,
              ease: "back.out(1.2)",
              stagger: { amount: 0.35 },
            },
            0.08,
          );
        }
      });

      root.querySelectorAll<HTMLElement>("main h2").forEach((heading) => {
        if (heading.closest("[data-mkt='featured'], [data-mkt='hero']")) return;
        gsap.set(heading, { clipPath: "inset(0 0 105% 0)", y: 24 });
        gsap.to(heading, {
          clipPath: "inset(0 0 -15% 0)",
          y: 0,
          duration: 0.85,
          ease: "power4.out",
          scrollTrigger: { trigger: heading, start: "top 92%", once: true },
        });
      });

      const laptop = root.querySelector<HTMLElement>(".marketing-laptop");
      const desk = root.querySelector<HTMLElement>("[data-mkt='coverage']");
      if (laptop && desk) {
        gsap.set(laptop, { transformPerspective: 1400, transformOrigin: "50% 50%" });
        gsap.fromTo(
          laptop,
          { scale: 0.92, rotationX: 10 },
          {
            scale: 1,
            rotationX: 0,
            ease: "none",
            scrollTrigger: {
              trigger: desk,
              start: "top 85%",
              end: "center 55%",
              scrub: 0.5,
            },
          },
        );
      }

      const phones = [...root.querySelectorAll<HTMLElement>(".marketing-phone")];
      const fan = root.querySelector<HTMLElement>("[data-mkt='app-showcase']");
      if (fan && phones.length) {
        const centre = (phones.length - 1) / 2;
        phones.forEach((phone, index) => {
          const offset = index - centre;
          if (offset === 0) return;
          gsap.fromTo(
            phone,
            { xPercent: -offset * 52, scale: 0.72, opacity: 0, rotation: offset * -5 },
            {
              xPercent: 0,
              scale: 1,
              opacity: 1,
              rotation: 0,
              ease: "none",
              scrollTrigger: {
                trigger: fan,
                start: "top 85%",
                end: "center 58%",
                scrub: 0.7,
              },
            },
          );
        });
      }
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    /* Recalculate triggers after feed filters change the page height. */
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    });
    observer.observe(root);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, [rootRef, enabled]);
}
