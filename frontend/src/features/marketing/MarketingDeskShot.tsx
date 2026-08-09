import { MacBookFrame } from "./MarketingDevices";

export default function MarketingDeskShot() {
  return (
    <div data-mkt="desk-shot" className="marketing-desk-shot">
      <div className="marketing-desk-shot__frame">
        <MacBookFrame>
          <img
            src="/marketing/hero.webp"
            srcSet="/marketing/hero.webp 1305w, /marketing/hero@2x.webp 2610w"
            sizes="(min-width: 780px) 700px, 100vw"
            alt="Pioni paper trading desk"
            width={1305}
            height={627}
            className="marketing-desk-shot__img"
            loading="lazy"
            decoding="async"
          />
        </MacBookFrame>
      </div>
    </div>
  );
}
