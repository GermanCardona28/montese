"use client";

import { useEffect, useState } from "react";
import MapaAuto from "@/components/MapaAuto";
import { BusColor, FlotaTexto } from "@/components/Flota";
import { cargarRutasMapa, hhmm, type RutaMapa } from "@/lib/rutas";

export default function Mapa() {
  const [rutas, setRutas] = useState<RutaMapa[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    cargarRutasMapa()
      .then((r) => {
        setRutas(r);
        const id = new URLSearchParams(window.location.search).get("ruta");
        if (id && r.some((x) => x.id === id)) setSel(id);
      })
      .catch(() => setError(true));
  }, []);

  const elegida = rutas?.find((r) => r.id === sel);
  const s = elegida?.schedules[0];

  return (
    <main className="relative flex flex-1 flex-col md:h-[calc(100svh-72px)] md:flex-none">
      <div className="relative min-h-[56svh] flex-1">
        {rutas && <MapaAuto className="absolute inset-0" rutas={rutas} selId={sel} onSelect={setSel} />}
        {!rutas && !error && <div className="skeleton absolute inset-0 rounded-none" />}
        {error && <p className="absolute inset-0 grid place-items-center text-red">No se pudo cargar el mapa.</p>}
        {rutas && !sel && (
          <p className="rise pointer-events-none absolute left-1/2 top-3 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-[var(--r)] bg-bg px-4 py-2.5 text-center text-[0.95rem] font-medium" style={{ ["--d" as string]: "600ms" }}>
            Toca una ruta del mapa para ver su recorrido completo
          </p>
        )}
      </div>

      <section className="hoja-in rounded-t-[var(--r)] bg-bg px-4 pb-3 pt-4 md:absolute md:bottom-4 md:left-4 md:w-[400px] md:rounded-[var(--r)] md:pb-4">
        {elegida ? (
          <div className="rise rounded-[var(--r)] bg-surface p-4" style={{ ["--d" as string]: "0ms" }}>
            <div className="flex items-start gap-3">
              <span className="cartel">{elegida.codigo}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{elegida.nombre}</p>
                <p className="mt-0.5 truncate text-sm text-muted">{elegida.companies?.nombre}</p>
              </div>
              <button onClick={() => setSel(null)} className="btn btn-ghost !min-h-9 !px-3 !text-sm" aria-label="Quitar selección">
                Todas
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-[var(--r-sm)] bg-bg p-3">
              <BusColor empresa={elegida.companies} size={64} />
              <p className="text-[0.95rem] leading-snug">
                Busca un bus <FlotaTexto empresa={elegida.companies} className="font-semibold lowercase" />
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.95rem]">
              {elegida.tarifa_cop && (<><dt className="text-muted">Pasaje</dt><dd className="font-semibold">${elegida.tarifa_cop.toLocaleString("es-CO")}</dd></>)}
              {s && (<><dt className="text-muted">Horario</dt><dd className="font-semibold">{hhmm(s.primera_salida)} – {hhmm(s.ultima_salida)}</dd></>)}
              {s && (<><dt className="text-muted">Cada</dt><dd className="font-semibold">{s.frecuencia_pico_min}–{s.frecuencia_valle_min} min</dd></>)}
              {elegida.longitud_km && (<><dt className="text-muted">Recorrido</dt><dd className="font-semibold">{elegida.longitud_km} km</dd></>)}
              {elegida.terminal && (<><dt className="text-muted">Terminal</dt><dd className="font-semibold">{elegida.terminal}</dd></>)}
            </dl>
          </div>
        ) : (
          <h1 className="heading px-1 text-[1.5rem]">Todas las rutas</h1>
        )}

        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {rutas?.map((r) => (
            <button
              key={r.id}
              onClick={() => setSel(sel === r.id ? null : r.id)}
              className={`cartel !min-w-0 shrink-0 !px-3 !py-2 !text-base transition-all active:scale-90 ${sel && sel !== r.id ? "opacity-35" : ""}`}
              aria-pressed={sel === r.id}
            >
              {r.codigo}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
