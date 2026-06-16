interface BrandLogoProps {
  className?: string;
  style?: React.CSSProperties;
  dark?: boolean;
}

export function BrandLogo({ className = "h-8 w-auto", style, dark = false }: BrandLogoProps) {
  const textColor = dark ? "#FFFFFF" : "#111111";
  return (
    <svg
      viewBox="0 0 180 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Рагулин Роман"
    >
      {/* House + PP monogram */}
      <g>
        <rect x="0" y="4" width="36" height="36" rx="10" fill="#E31E24" />
        <svg x="0" y="4" width="36" height="36" viewBox="0 0 100 100">
          {/* House outline */}
          <path
            d="M50 14 L86 50 L76 50 L76 84 L24 84 L24 50 L14 50 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Chimney */}
          <path
            d="M32 32 V18 H41 V24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Door */}
          <rect x="42" y="64" width="16" height="20" rx="1.5" fill="none" stroke="#FFFFFF" strokeWidth="4" />
          {/* Window */}
          <rect x="30" y="64" width="12" height="12" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />

          {/* PP badge */}
          <circle cx="64" cy="46" r="23" fill="#E31E24" stroke="#FFFFFF" strokeWidth="4" />
          <text
            x="64"
            y="54"
            textAnchor="middle"
            fontFamily="Manrope, system-ui, sans-serif"
            fontWeight="800"
            fontSize="22"
            fill="#FFFFFF"
            letterSpacing="-0.5"
          >PP</text>

          {/* Sparkle accent */}
          <path
            d="M89 80 L91 86 L97 88 L91 90 L89 96 L87 90 L81 88 L87 86 Z"
            fill="#FFFFFF"
          />
        </svg>
      </g>

      {/* Name */}
      <text
        x="48"
        y="30"
        fontFamily="Manrope, system-ui, sans-serif"
        fontWeight="700"
        fontSize="20"
        fill={textColor}
        letterSpacing="-0.5"
      >РАГУЛИН</text>
    </svg>
  );
}
