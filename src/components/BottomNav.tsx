"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Logo";
import { toquePestana } from "@/lib/reinicio";

const tabs = [
  { href: "/", label: "Inicio" },
  { href: "/rutas/", label: "Rutas" },
  { href: "/mapa/", label: "Mapa" },
  { href: "/empresas/", label: "Empresas" },
  { href: "/alertas/", label: "Alertas" },
];

// Los mismos dibujos que la barra de la app móvil
const ICONOS: Record<string, string> = {
  "/": "M12 3 3 10v10h6v-6h6v6h6V10z",
  "/rutas/": "M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z",
  "/mapa/": "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  "/empresas/":
    "M4 16c0 .9.4 1.7 1 2.2V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.8c.6-.5 1-1.3 1-2.2V6c0-3.5-3.6-4-8-4S4 2.5 4 6v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18 11H6V6h12v5z",
  "/alertas/":
    "M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.1-1.6-5.6-4.5-6.3V4a1.5 1.5 0 0 0-3 0v.7C7.6 5.4 6 7.9 6 11v5l-2 2v1h16v-1l-2-2z",
};

function Icono({ href, size = 24 }: { href: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d={ICONOS[href]} />
    </svg>
  );
}

function activa(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/viaje");
  return pathname.startsWith(href.slice(0, -1));
}

/** Barra superior: marca y enlaces en pantallas anchas. */
export function TopBar() {
  const pathname = usePathname();
  return (
      <header className="sticky top-0 z-20 hidden bg-bg/95 backdrop-blur-none md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Wordmark />
          <nav className="flex gap-2">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => toquePestana(t.href)}
                className={`inline-flex items-center gap-2 rounded-[var(--r)] px-5 py-2.5 text-base font-semibold transition-colors ${
                  activa(pathname, t.href) ? "bg-yellow text-[#111]" : "text-white hover:bg-surface-2"
                }`}
              >
                <Icono href={t.href} size={20} />
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
  );
}

/** Barra inferior del celular. */
export default function BottomNav() {
  const pathname = usePathname();
  return (
      <nav
        className="sticky bottom-0 z-30 bg-surface md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Principal"
      >
        <ul className="mx-auto flex max-w-md gap-1 p-2">
          {tabs.map((t) => (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                onClick={() => toquePestana(t.href)}
                className={`flex flex-col items-center gap-0.5 rounded-[var(--r)] py-2 text-center text-[0.75rem] font-semibold transition-colors ${
                  activa(pathname, t.href) ? "bg-yellow text-[#111]" : "text-muted active:bg-surface-2"
                }`}
              >
                <Icono href={t.href} />
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
  );
}
