import type { ReactNode } from "react";

export function MacBookFrame({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-macbook">
      <div className="marketing-macbook__lid">
        <span className="marketing-macbook__camera" aria-hidden />
        <div className="marketing-macbook__screen">{children}</div>
      </div>
      <div className="marketing-macbook__base" aria-hidden>
        <span className="marketing-macbook__notch" />
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="marketing-phone__status" aria-hidden>
      <span className="font-semibold">9:41</span>
      <span className="flex items-center gap-1">
        <svg width="15" height="9" viewBox="0 0 15 9" fill="currentColor">
          <rect x="0" y="6" width="2.4" height="3" rx="0.6" />
          <rect x="4" y="4" width="2.4" height="5" rx="0.6" />
          <rect x="8" y="2" width="2.4" height="7" rx="0.6" />
          <rect x="12" y="0" width="2.4" height="9" rx="0.6" />
        </svg>
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none" stroke="currentColor">
          <path d="M1 3.2a7 7 0 0 1 10 0" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M3.2 5.4a4 4 0 0 1 5.6 0" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="6" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
        </svg>
        <svg width="18" height="9" viewBox="0 0 18 9" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="14"
            height="8"
            rx="2.2"
            stroke="currentColor"
            strokeOpacity="0.45"
          />
          <rect x="2" y="2" width="10" height="5" rx="1.2" fill="currentColor" />
          <path
            d="M16 3.2v2.6a1.6 1.6 0 0 0 0-2.6Z"
            fill="currentColor"
            fillOpacity="0.45"
          />
        </svg>
      </span>
    </div>
  );
}

export function PhoneFrame({
  children,
  depth,
  label,
}: {
  children: ReactNode;
  depth: 0 | 1 | 2;
  label: string;
}) {
  return (
    <div className="marketing-phone" data-depth={depth}>
      <div className="marketing-phone__body">
        <div className="marketing-phone__screen">
          <span className="marketing-phone__island" aria-hidden />
          <StatusBar />
          <div className="marketing-phone__content" role="img" aria-label={label}>
            {children}
          </div>
          <span className="marketing-phone__home" aria-hidden />
        </div>
      </div>
    </div>
  );
}
