interface EtazhiLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Official Etazhi logo — red building icon + ЭТАЖИ wordmark.
 * Recreated to match the brand asset exactly.
 */
export function EtazhiLogo({ className = "h-7 w-auto", style }: EtazhiLogoProps) {
  return (
    <svg
      viewBox="0 0 280 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Этажи"
    >
      {/* Building icon — angled silhouette with horizontal floor lines */}
      <g fill="#a20d0f">
        <path d="M 8 70 L 8 30 L 48 14 L 48 70 Z" />
      </g>
      {/* Floor lines cut from the building (white) */}
      <g stroke="#FFFFFF" strokeWidth="2.5" fill="none">
        <line x1="22" y1="22" x2="48" y2="22" />
        <line x1="22" y1="30" x2="48" y2="30" />
        <line x1="22" y1="38" x2="48" y2="38" />
        <line x1="22" y1="46" x2="48" y2="46" />
        <line x1="22" y1="54" x2="48" y2="54" />
        <line x1="22" y1="62" x2="48" y2="62" />
      </g>

      {/* Wordmark ЭТАЖИ */}
      <text
        x="68"
        y="62"
        fontFamily="Manrope, system-ui, sans-serif"
        fontWeight="800"
        fontSize="58"
        fill="#a20d0f"
        letterSpacing="-1"
      >
        этажи
      </text>
    </svg>
  );
}
