import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ENTRANCE =
  "[data-mkt='header'], [data-mkt='subnav'], [data-mkt='eyebrow'], [data-mkt='title'], [data-mkt='lede'], [data-mkt='ctas'], [data-mkt='disclaimer'], [data-mkt='hero-media']";

// Cards rise in sequence so a long grid reads as a list being dealt rather than
// one large panel appearing. Phones are excluded: they get a scrubbed spread.
const REVEALS: { section: string; items?: string }[] = [
  { section: "[data-mkt='how']", items: "[data-mkt='how-step']" },
  { section: "[data-mkt='float-markets']", items: "[data-mkt='float-card']" },
  { section: "[data-mkt='practice']", items: "[data-mkt='practice-card']" },
  { section: "[data-mkt='desk-gallery']", items: ".marketing-desk-gallery__cell" },
  { section: "[data-mkt='app-showcase']" },
  { section: "[data-mkt='faq']", items: "[data-mkt='faq-item']" },
  { section: "[data-mkt='closing']" },
  { section: "[data-mkt='footer']" },
];

const SECTION_SELECTOR = REVEALS.map((reveal) => reveal.section).join(", ");

const RESET_SELECTOR = [
  ENTRANCE,
  SECTION_SELECTOR,
  "[data-mkt='hero-copy']",
  "[data-mkt='how-step']",
  "[data-mkt='float-card']",
  "[data-mkt='practice-card']",
  ".marketing-desk-gallery__cell",
  "[data-mkt='faq-item']",
  ".marketing-phone",
  ".marketing-macbook",
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
      gsap.set(entrance, { opacity: 0, y: 22 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to("[data-mkt='header']", { opacity: 1, y: 0, duration: 0.45 }, 0)
        .to("[data-mkt='subnav']", { opacity: 1, y: 0, duration: 0.4 }, 0.05)
        .to("[data-mkt='eyebrow']", { opacity: 1, y: 0, duration: 0.4 }, 0.1)
        .to("[data-mkt='title']", { opacity: 1, y: 0, duration: 0.7 }, 0.16)
        .to("[data-mkt='lede']", { opacity: 1, y: 0, duration: 0.6 }, 0.28)
        .to("[data-mkt='hero-media']", { opacity: 1, y: 0, duration: 0.8 }, 0.3)
        .to("[data-mkt='ctas']", { opacity: 1, y: 0, duration: 0.5 }, 0.4)
        .to("[data-mkt='disclaimer']", { opacity: 1, y: 0, duration: 0.45 }, 0.48);

      // set + to, never fromTo: a ScrollTrigger refresh re-renders a fromTo's
      // start values, which would strand these at opacity 0 after `once` fires.
      REVEALS.forEach(({ section, items }) => {
        const target = root.querySelector<HTMLElement>(section);
        if (!target) return;
        const cards = items ? target.querySelectorAll<HTMLElement>(items) : [];

        gsap.set(target, { opacity: 0, y: 56 });
        if (cards.length) gsap.set(cards, { opacity: 0, y: 44, scale: 0.94 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: target, start: "top 88%", once: true },
          defaults: { ease: "power3.out" },
        });
        tl.to(target, { opacity: 1, y: 0, duration: 0.7 }, 0);
        if (cards.length) {
          tl.to(
            cards,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              ease: "back.out(1.4)",
              // amount, not each: an 18-card grid must not take 18 steps to land.
              stagger: { amount: 0.5 },
            },
            0.1,
          );
        }
      });

      // Headings wipe up behind their own bounds. Bottom inset overshoots so
      // descenders are not clipped at the end of the reveal.
      root.querySelectorAll<HTMLElement>("main h2").forEach((heading) => {
        gsap.set(heading, { clipPath: "inset(0 0 105% 0)", y: 34 });
        gsap.to(heading, {
          clipPath: "inset(0 0 -15% 0)",
          y: 0,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: { trigger: heading, start: "top 90%", once: true },
        });
      });

      const laptop = root.querySelector<HTMLElement>(".marketing-macbook");
      const hero = root.querySelector<HTMLElement>("[data-mkt='hero']");
      if (laptop && hero) {
        // Trigger off the hero, never the laptop: a scaled element that is also
        // its own trigger feeds its transform back into ScrollTrigger's maths and
        // silently collapses the usable scroll range.
        gsap.set(laptop, { transformPerspective: 1400, transformOrigin: "50% 50%" });
        gsap.fromTo(
          laptop,
          { scale: 0.82, rotationX: 20 },
          {
            scale: 1,
            rotationX: 0,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom 75%",
              scrub: 0.6,
            },
          },
        );
        gsap.to(laptop, {
          yPercent: -10,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "bottom 75%",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      }

      // Hero copy drifts out of the way as the product shot takes over.
      const heroCopy = root.querySelector<HTMLElement>("[data-mkt='hero-copy']");
      if (heroCopy) {
        gsap.to(heroCopy, {
          yPercent: -22,
          opacity: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: heroCopy,
            start: "bottom 75%",
            end: "bottom 15%",
            scrub: 0.6,
          },
        });
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

    // Late-loading hero art shifts every trigger measured below it.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, [rootRef, enabled]);
}
