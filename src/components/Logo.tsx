import Link from "next/link";

/** Marca "La Buseta": buseta amarilla de frente sobre placa verde; el parabrisas forma la "M" de Móntese. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="116" fill="#1f9d55" />
      <rect x="84" y="150" width="30" height="72" rx="13" fill="#191919" />
      <rect x="398" y="150" width="30" height="72" rx="13" fill="#191919" />
      <rect x="104" y="166" width="24" height="14" fill="#191919" />
      <rect x="384" y="166" width="24" height="14" fill="#191919" />
      <rect x="150" y="372" width="58" height="60" rx="16" fill="#191919" />
      <rect x="304" y="372" width="58" height="60" rx="16" fill="#191919" />
      <rect x="122" y="84" width="268" height="316" rx="58" fill="#ffd500" />
      <rect x="186" y="104" width="140" height="28" rx="14" fill="#191919" />
      <path d="M144 302V168a18 18 0 0 1 18-18h26l68 78 68-78h26a18 18 0 0 1 18 18v134h-54v-74l-58 66-58-66v74Z" fill="#191919" />
      <circle cx="170" cy="348" r="21" fill="#fff" />
      <circle cx="342" cy="348" r="21" fill="#fff" />
      <rect x="216" y="338" width="80" height="20" rx="10" fill="#191919" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Móntese, inicio">
      <LogoMark size={38} />
      <span className="heading text-[1.55rem] text-white">Móntese</span>
    </Link>
  );
}
