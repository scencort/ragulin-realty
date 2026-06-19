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
          PP monogram: two overlapping hollow P letters.
          Left P sits behind/above, right P offset right+down.
          Both drawn white; bowls at different heights so both remain visible.
        */}

        {/* Left P (back layer) */}
        <path
          fillRule="evenodd"
          fill="#FFFFFF"
          d="M16,13 L51,13 Q63,13 63,27 Q63,40 51,40 L28,40 L28,82 L16,82 Z
             M26,21 L43,21 Q53,21 53,27 Q53,33 43,33 L26,33 Z"
        />

        {/* Right P (front layer, offset right and down) */}
        <path
          fillRule="evenodd"
          fill="#FFFFFF"
          d="M34,24 L69,24 Q81,24 81,38 Q81,51 69,51 L46,51 L46,86 L34,86 Z
             M44,32 L61,32 Q71,32 71,38 Q71,44 61,44 L44,44 Z"
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
