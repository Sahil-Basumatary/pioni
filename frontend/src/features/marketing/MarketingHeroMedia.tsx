import { useEffect, useRef, useState } from "react";

const HERO_STILL = "/marketing/hero.webp";
const HERO_LOOP = "/marketing/hero.mp4";

export default function MarketingHeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [loopReady, setLoopReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotionAllowed(!mq.matches);
  }, []);

  useEffect(() => {
    if (!motionAllowed) return;
    // Deferred so the loop never competes with the still for first paint.
    const timer = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      // Autoplay can be refused (data saver, low power); the still stays as the visible layer.
      void video.play().catch(() => setLoopReady(false));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [motionAllowed]);

  return (
    <div data-mkt="hero-media" className="marketing-hero-media">
      <div className="marketing-hero-media__frame">
        <img
          src={HERO_STILL}
          alt="Pioni paper trading desk"
          width={1920}
          height={1080}
          className="marketing-hero-media__img"
          fetchPriority="high"
        />
        {motionAllowed ? (
          <video
            ref={videoRef}
            className="marketing-hero-media__video"
            data-ready={loopReady ? "true" : "false"}
            src={HERO_LOOP}
            poster={HERO_STILL}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden
            tabIndex={-1}
            onCanPlay={() => setLoopReady(true)}
          />
        ) : null}
      </div>
    </div>
  );
}
