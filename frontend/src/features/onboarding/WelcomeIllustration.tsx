export default function WelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 480 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pioniWelcomeSky" x1="40" y1="20" x2="440" y2="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7F7F7" />
          <stop offset="1" stopColor="#EFEFEF" />
        </linearGradient>
        <linearGradient id="pioniWelcomeCard" x1="120" y1="48" x2="360" y2="232" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F4F4F4" />
        </linearGradient>
        <linearGradient id="pioniWelcomeInk" x1="160" y1="90" x2="320" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2A2A2A" />
          <stop offset="1" stopColor="#6A6A6A" />
        </linearGradient>
        <filter id="pioniWelcomeSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#000000" floodOpacity="0.08" />
        </filter>
        <filter id="pioniWelcomeLift" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.1" />
        </filter>
      </defs>
      <rect width="480" height="280" rx="24" fill="url(#pioniWelcomeSky)" />
      <g opacity="0.45">
        <path d="M48 64H432" stroke="#D4D4D4" strokeWidth="1" />
        <path d="M48 112H432" stroke="#D4D4D4" strokeWidth="1" />
        <path d="M48 160H432" stroke="#D4D4D4" strokeWidth="1" />
        <path d="M48 208H432" stroke="#D4D4D4" strokeWidth="1" />
        <path d="M96 40V240" stroke="#D4D4D4" strokeWidth="1" />
        <path d="M192 40V240" stroke="#D4D4D4" strokeWidth="1" />
        <path d="M288 40V240" stroke="#D4D4D4" strokeWidth="1" />
        <path d="M384 40V240" stroke="#D4D4D4" strokeWidth="1" />
      </g>
      <g className="pioni-welcome-orbit" filter="url(#pioniWelcomeSoft)">
        <circle cx="92" cy="78" r="28" fill="#FFFFFF" stroke="#E5E5E5" />
        <circle cx="92" cy="78" r="10" fill="#2A2A2A" className="pioni-welcome-pulse" />
      </g>
      <g className="pioni-welcome-float" filter="url(#pioniWelcomeLift)">
        <rect x="118" y="56" width="244" height="168" rx="20" fill="url(#pioniWelcomeCard)" stroke="#E8E8E8" />
        <rect x="138" y="76" width="72" height="10" rx="5" fill="#E8E8E8" />
        <rect x="138" y="94" width="44" height="8" rx="4" fill="#F0F0F0" />
        <g className="pioni-welcome-bars">
          <rect className="pioni-welcome-bar" x="150" y="168" width="14" height="36" rx="3" fill="#C8C8C8" />
          <rect className="pioni-welcome-bar" x="174" y="148" width="14" height="56" rx="3" fill="#9A9A9A" />
          <rect className="pioni-welcome-bar" x="198" y="132" width="14" height="72" rx="3" fill="#2A2A2A" />
          <rect className="pioni-welcome-bar" x="222" y="142" width="14" height="62" rx="3" fill="#6A6A6A" />
          <rect className="pioni-welcome-bar" x="246" y="120" width="14" height="84" rx="3" fill="#2A2A2A" />
          <rect className="pioni-welcome-bar" x="270" y="136" width="14" height="68" rx="3" fill="#8A8A8A" />
          <rect className="pioni-welcome-bar" x="294" y="112" width="14" height="92" rx="3" fill="#0A0A0A" />
          <rect className="pioni-welcome-bar" x="318" y="128" width="14" height="76" rx="3" fill="#4A4A4A" />
        </g>
        <path
          className="pioni-welcome-line"
          d="M150 176C170 170 182 156 198 148C214 140 226 146 246 128C266 110 282 118 332 108"
          stroke="url(#pioniWelcomeInk)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle className="pioni-welcome-tip" cx="332" cy="108" r="5" fill="#0A0A0A" />
      </g>
      <g className="pioni-welcome-chip" filter="url(#pioniWelcomeLift)">
        <rect x="330" y="176" width="92" height="56" rx="14" fill="#FFFFFF" stroke="#E5E5E5" />
        <text x="348" y="200" fill="#8A8A8A" fontSize="10" fontFamily="Inter, system-ui, sans-serif">
          Paper
        </text>
        <text x="348" y="218" fill="#0A0A0A" fontSize="16" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
          $100k
        </text>
      </g>
      <g className="pioni-welcome-spark" opacity="0.9">
        <path d="M388 72L392 84L404 88L392 92L388 104L384 92L372 88L384 84L388 72Z" fill="#2A2A2A" />
      </g>
    </svg>
  );
}
