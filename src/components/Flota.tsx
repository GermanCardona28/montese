import { coloresBus, type EmpresaFlota } from "@/lib/rutas";

/** Bus de lado pintado con los colores de la flota: así el usuario sabe qué bus mirar para pararlo. */
export function BusColor({ empresa, size = 56 }: { empresa: EmpresaFlota | null; size?: number }) {
  const [c1, c2] = empresa?.flota_colores?.length ? coloresBus({ companies: empresa }) : ["#8a8a8a", "#6d6d6d"]; // gris = color sin confirmar
  const cuerpo = c1;
  const franja = c2 ?? c1;
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 120 60" aria-hidden="true" className="shrink-0">
      <rect x="2" y="6" width="116" height="40" rx="9" fill={cuerpo} stroke="#00000033" strokeWidth="1.5" />
      <rect x="2" y="30" width="116" height="9" fill={franja} />
      <rect x="9" y="12" width="20" height="15" rx="3" fill="#1a2a30" />
      <rect x="33" y="12" width="20" height="15" rx="3" fill="#1a2a30" />
      <rect x="57" y="12" width="20" height="15" rx="3" fill="#1a2a30" />
      <rect x="83" y="12" width="29" height="22" rx="3" fill="#1a2a30" />
      <circle cx="28" cy="46" r="8" fill="#111" />
      <circle cx="28" cy="46" r="3" fill="#bbb" />
      <circle cx="92" cy="46" r="8" fill="#111" />
      <circle cx="92" cy="46" r="3" fill="#bbb" />
    </svg>
  );
}

/** Descripción corta del color: "Amarillo con verde". Marca cuando está por confirmar. */
export function FlotaTexto({ empresa, className = "" }: { empresa: EmpresaFlota | null; className?: string }) {
  if (!empresa?.flota_descripcion) return null;
  if (!empresa.flota_colores?.length) return <span className={className}>de color por confirmar</span>;
  return (
    <span className={className}>
      {empresa.flota_descripcion}
      {empresa.flota_confianza === "baja" && !empresa.flota_descripcion.includes("confirmar") ? " (por confirmar)" : ""}
    </span>
  );
}
