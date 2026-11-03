"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Logo";

const tabs = [
  { href: "/", label: "Inicio" },
  { href: "/rutas/", label: "Rutas" },
  { href: "/mapa/", label: "Mapa" },
  { href: "/empresas/", label: "Empresas" },
  { href: "/alertas/", label: "Alertas" },
];

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
                className={`rounded-[var(--r)] px-5 py-2.5 text-base font-semibold transition-colors ${
                  activa(pathname, t.href) ? "bg-yellow text-[#111]" : "text-white hover:bg-surface-2"
                }`}
              >
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
                className={`block rounded-[var(--r)] py-3 text-center text-[0.8rem] font-semibold transition-colors ${
                  activa(pathname, t.href) ? "bg-yellow text-[#111]" : "text-muted active:bg-surface-2"
                }`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
  );
}
