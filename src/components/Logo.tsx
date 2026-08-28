type LogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  inverted?: boolean;
};

export default function Logo({ size = 44, className = "", showWordmark = false, inverted = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/images/alenna-logo.png"
        alt="Alenna Cafe"
        width={size}
        height={size}
        className="rounded-full object-cover shadow-md ring-1 ring-brand/30"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <div className="leading-tight">
          <p
            className={`text-lg font-bold tracking-tight ${inverted ? "text-white" : "text-teal"}`}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Alenna
          </p>
          <p className={`text-[10px] tracking-[0.28em] uppercase ${inverted ? "text-brand-light" : "text-brand-dark/70"}`}>
            Cafe
          </p>
        </div>
      )}
    </div>
  );
}
