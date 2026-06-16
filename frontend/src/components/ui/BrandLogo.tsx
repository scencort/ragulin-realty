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
      {/* Monogram circle */}
      <rect x="0" y="4" width="36" height="36" rx="10" fill="#E31E24" />
      <text
        x="18"
        y="28"
        textAnchor="middle"
        fontFamily="Manrope, system-ui, sans-serif"
        fontWeight="800"
        fontSize="15"
        fill="#FFFFFF"
        letterSpacing="-0.5"
      >РР</text>

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
