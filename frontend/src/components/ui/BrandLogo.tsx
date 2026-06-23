interface BrandLogoProps {
  className?: string;
  style?: React.CSSProperties;
  dark?: boolean;
}

export function BrandLogo({ className = "h-8 w-auto", style }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} style={style}>
      <img
        src="/logo-icon.png?v=2"
        alt="Рагулин Роман"
        className="h-full w-auto flex-shrink-0"
        style={{ borderRadius: "14%" }}
      />
    </span>
  );
}
