interface BrandLogoProps {
  className?: string;
  style?: React.CSSProperties;
  dark?: boolean;
}

export function BrandLogo({ className = "h-8 w-auto", style, dark = false }: BrandLogoProps) {
  const textColor = dark ? "#FFFFFF" : "#111111";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} style={style}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto flex-shrink-0">
        {/* Dark maroon background */}
        <rect width="100" height="100" rx="14" fill="#5C0A10" />

        {/*
          PP shield monogram — compound path (evenodd).
          Outer shield is white. Three dark cutouts punch through:
            1. Left P interior (rectangle)
            2. Center divider strip (separates L and R letter forms)
            3. Right P interior (D-shaped arc)
        */}
        <path
          fillRule="evenodd"
          fill="#FFFFFF"
          d={[
            // Outer shield
            "M23,12 L77,12 Q85,12 85,20 L85,58 Q85,76 50,88 Q15,76 15,58 L15,20 Q15,12 23,12 Z",
            // Left P interior hole
            "M27,20 L41,20 L41,47 L27,47 Z",
            // Center divider (thin strip, pointed at bottom like shield)
            "M44,20 L49,20 L49,82 L46.5,86 L44,82 Z",
            // Right P interior hole (D-shape)
            "M52,20 Q79,20 79,35 Q79,48 52,48 Z",
          ].join(" ")}
        />
      </svg>

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
