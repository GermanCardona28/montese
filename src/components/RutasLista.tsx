"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BusColor, FlotaTexto } from "@/components/Flota";
import { cargarRutasLista, estadoAhora, esHoraPico, hhmm, type Ruta } from "@/lib/rutas";

export default function RutasLista({ empresa }: { empresa?: string }) {
  const [rutas, setRutas] = useState<Ruta[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);

  useEffect(() => {
    cargarRutasLista().then(setRutas).catch(() => setError(true));
  }, []);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rutas ?? []).filter(
      (r) =>
        (!empresa || r.companies?.nombre === empresa) &&
        (!t || `${r.codigo} ${r.nombre} ${r.companies?.nombre}`.toLowerCase().includes(t))
    );
  }, [rutas, q, empresa]);

  if (error) return <p className="text-red">No se pudieron cargar las rutas. Revisa tu conexión.</p>;
  if (!rutas)
    return (
      <div className="flex flex-col gap-3">
        <div className="skeleton h-14" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Barrio, número o empresa" className="campo" aria-label="Buscar ruta" />
      <p className="text-muted">
        {filtradas.length} rutas · {esHoraPico() ? "ahora es hora pico" : "ahora es hora valle"}
      </p>

      <ul className="flex flex-col gap-2">
        {filtradas.map((r, i) => {
          const e = estadoAhora(r);
          const s = r.schedules[0];
          const open = abierta === r.id;
          const porVerificar = r.estado === "por_verificar";
          const conTrazado = !!r.trazado_fuente;
          return (
            <li key={r.id} className="rise" style={{ ["--d" as string]: `${Math.min(i, 8) * 45}ms` }}>
              <div className={`overflow-hidden rounded-[var(--r)] transition-colors ${open ? "bg-surface-2" : "bg-surface"}`}>
                <button onClick={() => setAbierta(open ? null : r.id)} className="flex w-full items-start gap-3 p-4 text-left" aria-expanded={open}>
                  <span className="cartel mt-0.5">{r.codigo}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.05rem] font-semibold leading-snug">{r.nombre}</span>
                    <span className="mt-1.5 flex items-center gap-2 text-sm text-muted">
                      <BusColor empresa={r.companies} size={34} />
                      <span className="truncate">{r.companies?.nombre}</span>
                    </span>
                    {porVerificar ? (
                      <span className="mt-2 block text-sm font-semibold text-yellow">{conTrazado ? "Por verificar · trazado aproximado, sin horario" : "Por verificar · sin horario ni trazado"}</span>
                    ) : (
                      <span className={`mt-2 flex items-center gap-2 text-sm font-semibold ${e.operando ? "text-[#4ade80]" : "text-muted"}`}>
                        <span className={`inline-block h-2 w-2 rounded-full bg-current ${e.operando ? "punto-vivo" : ""}`} />
                        {e.operando ? `En servicio${e.frecuencia ? ` · cada ~${e.frecuencia} min` : ""}` : "Fuera de servicio"}
                      </span>
                    )}
                  </span>
                  <span className="text-right text-lg font-bold">{r.tarifa_cop ? `$${r.tarifa_cop.toLocaleString("es-CO")}` : ""}</span>
                </button>

                {open && (
                  <div className="rise px-4 pb-5" style={{ ["--d" as string]: "0ms" }}>
                    <div className="flex items-center gap-3 rounded-[var(--r-sm)] bg-bg p-3">
                      <BusColor empresa={r.companies} size={64} />
                      <p className="text-[0.95rem] leading-snug">
                        Busca un bus <FlotaTexto empresa={r.companies} className="font-semibold lowercase" />
                      </p>
                    </div>
                    {s && (
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-[var(--r-sm)] bg-bg p-4 text-[0.98rem]">
                        <dt className="text-muted">Primer despacho</dt><dd className="font-semibold">{hhmm(s.primera_salida)}</dd>
                        <dt className="text-muted">Último despacho</dt><dd className="font-semibold">{hhmm(s.ultima_salida)}</dd>
                        <dt className="text-muted">Frecuencia pico</dt><dd className="font-semibold">{s.frecuencia_pico_min} min</dd>
                        <dt className="text-muted">Frecuencia valle</dt><dd className="font-semibold">{s.frecuencia_valle_min} min</dd>
                        {r.longitud_km && (<><dt className="text-muted">Longitud</dt><dd className="font-semibold">{r.longitud_km} km</dd></>)}
                        {r.terminal && (<><dt className="text-muted">Terminal</dt><dd className="font-semibold">{r.terminal}</dd></>)}
                      </dl>
                    )}
                    {r.recorrido && <p className="mt-3 text-[0.95rem] leading-snug text-muted">{r.recorrido}</p>}
                    {porVerificar && (
                      <p className="mt-3 text-[0.95rem] leading-snug text-muted">
                        {conTrazado ? "El trazado es aproximado (por carretera) y el horario no está confirmado. Aparece como fuera de servicio en los viajes." : "Esta ruta aparece en fuentes públicas pero aún no está confirmada por la autoridad de transporte. No se usa para calcular viajes."}
                      </p>
                    )}
                    {conTrazado && (
                      <Link href={`/mapa/?ruta=${r.id}`} className="btn btn-yellow mt-4 w-full">
                        Ver su recorrido en el mapa
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
