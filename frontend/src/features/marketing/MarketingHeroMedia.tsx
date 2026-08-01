const HERO_WEBP = "/marketing/hero.webp";
const HERO_FALLBACK = "/marketing/hero-fallback.svg";

export default function MarketingHeroMedia() {
  return (
    <div data-mkt="hero-media" className="marketing-hero-media">
      <div className="marketing-hero-media__frame">
        <picture>
          <source srcSet={HERO_WEBP} type="image/webp" />
          <img
            src={HERO_FALLBACK}
            alt="Pioni paper trading desk"
            className="marketing-hero-media__img"
          />
        </picture>
      </div>
    </div>
  );
}
