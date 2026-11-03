import Link from "next/link";

/** Marca: un bus amarillo visto de frente; el parabrisas verde forma la "M" de Móntese. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="8" y="8" width="48" height="46" rx="12" fill="#ffd500" />
      <rect x="16" y="13" width="32" height="8" rx="4" fill="#1f9d55" />
      <path d="M14 46V27h8l10 10 10-10h8v19h-7v-9.5L32 47l-11-10.5V46Z" fill="#1f9d55" />
      <circle cx="17" cy="52" r="3.2" fill="#fff" />
      <circle cx="47" cy="52" r="3.2" fill="#fff" />
      <rect x="13" y="54" width="11" height="7" rx="3" fill="#191919" />
      <rect x="40" y="54" width="11" height="7" rx="3" fill="#191919" />
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
