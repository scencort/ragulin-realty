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
        <defs>
          <clipPath id="pp-clip">
            <rect width="100" height="100" rx="14"/>
          </clipPath>
        </defs>

        {/* Red background */}
        <rect width="100" height="100" rx="14" fill="#C80E0E"/>

        <g clipPath="url(#pp-clip)">
          {/* 3D depth shadow — dark maroon, offset lower-left */}
          <g transform="translate(-5,5)">
            <path fillRule="evenodd" fill="#7B0000"
              d="M16,12 L52,12 Q65,12 65,27 Q65,41 52,41 L28,41 L28,83 L16,83 Z
                 M26,21 L44,21 Q55,21 55,27 Q55,34 44,34 L26,34 Z"/>
            <path fillRule="evenodd" fill="#7B0000"
              d="M34,23 L70,23 Q83,23 83,38 Q83,53 70,53 L46,53 L46,87 L34,87 Z
                 M44,32 L62,32 Q73,32 73,38 Q73,45 62,45 L44,45 Z"/>
          </g>

          {/* White front faces */}
          <path fillRule="evenodd" fill="#FFFFFF"
            d="M16,12 L52,12 Q65,12 65,27 Q65,41 52,41 L28,41 L28,83 L16,83 Z
               M26,21 L44,21 Q55,21 55,27 Q55,34 44,34 L26,34 Z"/>
          <path fillRule="evenodd" fill="#FFFFFF"
            d="M34,23 L70,23 Q83,23 83,38 Q83,53 70,53 L46,53 L46,87 L34,87 Z
               M44,32 L62,32 Q73,32 73,38 Q73,45 62,45 L44,45 Z"/>
        </g>
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
