interface BrandLogoProps {
  className?: string;
  style?: React.CSSProperties;
  dark?: boolean;
}

export function BrandLogo({ className = "h-8 w-auto", style, dark = false }: BrandLogoProps) {
  const textColor = dark ? "#FFFFFF" : "#111111";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} style={style}>
      <img
        src="/logo-icon.png"
        alt="Рагулин Роман"
        className="h-full w-auto rounded-[22%] flex-shrink-0"
      />
      <svg viewBox="0 0 110 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[55%] w-auto">
        <text
          x="0"
          y="19"
          fontFamily="Manrope, system-ui, sans-serif"
          fontWeight="700"
          fontSize="20"
          fill={textColor}
          letterSpacing="-0.5"
        >РАГУЛИН</text>
      </svg>
    </span>
  );
}
