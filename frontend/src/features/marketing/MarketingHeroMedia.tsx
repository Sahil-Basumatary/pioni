import { MacBookFrame } from "./MarketingDevices";

export default function MarketingHeroMedia() {
  return (
    <div data-mkt="hero-media" className="marketing-hero-media">
      <div className="marketing-hero-media__frame">
        <MacBookFrame>
          <img
            src="/marketing/hero.webp"
            srcSet="/marketing/hero.webp 1305w, /marketing/hero@2x.webp 2610w"
            sizes="(min-width: 1280px) 1160px, 100vw"
            alt="Pioni paper trading desk"
            width={1305}
            height={627}
            className="marketing-hero-media__img"
            fetchPriority="high"
          />
        </MacBookFrame>
      </div>
    </div>
  );
}
