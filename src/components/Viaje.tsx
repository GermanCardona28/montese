"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MapaAuto from "@/components/MapaAuto";
import { BusColor, FlotaTexto } from "@/components/Flota";
import { conCaminataReal } from "@/lib/caminata";
import { pasajeTotal, planificar, type Paso, type Plan } from "@/lib/geo";
import { factorTrafico, hayGoogle, type Trafico } from "@/lib/google";
import { decodificarLugar, type Lugar } from "@/lib/lugares";
import { cargarIncidentes, cargarRutasMapa, esHoraPico, flotaDe, hhmm, type Incidente, type RutaMapa } from "@/lib/rutas";

const hora = (d: Date) => d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
const dist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);
const pesos = (n: number) => `$${n.toLocaleString("es-CO")}`;

function Resumen({ plan }: { plan: Plan }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {plan.pasos.map((p, i) =>
        p.tipo === "caminar" ? (
          <span key={i} className="grid h-8 min-w-8 place-items-center rounded-full bg-white/15 px-2 text-sm font-semibold" title="Caminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-label="Caminar">
              <circle cx="13" cy="4" r="2" />
              <path d="M10 22l1.5-7L9 13l1-5 3 2 3 1v2l-2-.5-1 3 2 3.5V22h-2l-1.5-3.5L12 22z" />
            </svg>
            <span className="sr-only">{p.min} min</span>
          </span>
        ) : (
          <span key={i} className="cartel !min-w-0 !px-2.5 !py-1 !text-base">
            {p.ruta.codigo}
          </span>
        )
      )}
    </div>
  );
}

function Pasos({ plan, ahora }: { plan: Plan; ahora: Date }) {
  let reloj = ahora.getTime();
  const linea = (p: Paso, i: number) => {
    const inicio = new Date(reloj);
    if (p.tipo === "caminar") {
      reloj += p.min * 60000;
      const destino = p.hacia === "ruta" ? "hasta donde pasa el bus" : p.hacia === "transbordo" ? (p.estacion ? `dentro de la ${p.estacion} hasta el siguiente bus` : "hasta el siguiente bus") : "hasta tu destino";
      return (
        <li key={i} className="relative pl-12">
          <span className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full bg-white/15">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="13" cy="4" r="2" />
              <path d="M10 22l1.5-7L9 13l1-5 3 2 3 1v2l-2-.5-1 3 2 3.5V22h-2l-1.5-3.5L12 22z" />
            </svg>
          </span>
          <p className="font-semibold">
            {p.hacia === "transbordo" ? "Transbordo: camina" : "Camina"} {p.min} min · {dist(p.metros)}
          </p>
          <p className="text-muted">{destino}</p>
        </li>
      );
    }
    reloj += (p.minEspera + p.minViaje) * 60000;
    return (
      <li key={i} className="relative pl-12">
        <span className="absolute left-0 top-0 cartel !min-w-9 !px-1.5 !py-1 !text-sm">{p.ruta.codigo}</span>
        <p className="font-semibold">
          Sube a la ruta {p.ruta.codigo}{p.estacionSube ? ` en la ${p.estacionSube}` : ""} <span className="font-normal text-muted">· sales ~ {hora(new Date(inicio.getTime() + p.minEspera * 60000))}</span>
        </p>
        <div className="mt-2 flex items-center gap-3 rounded-[var(--r-sm)] bg-bg p-3">
          <BusColor empresa={flotaDe(p.ruta)} size={64} />
          <div className="min-w-0 text-[0.95rem] leading-snug">
            <p className="font-semibold">Busca un bus <FlotaTexto empresa={flotaDe(p.ruta)} className="lowercase" /></p>
            <p className="truncate text-muted">{p.ruta.companies?.nombre}</p>
          </div>
        </div>
        <p className="mt-2 text-muted">
          Espera ~{p.minEspera} min{p.frecuencia ? ` (pasa cada ~${p.frecuencia} min)` : ""}. Viaja {p.minViaje} min · {dist(p.metros)} y bájate {p.estacionBaja ? `en la ${p.estacionBaja}` : "en el punto marcado en el mapa"}.
        </p>
        {!p.enServicio && p.ruta.schedules[0] && <p className="mt-1 text-yellow">Fuera de servicio ahora. Primer bus a las {hhmm(p.ruta.schedules[0].primera_salida)}.</p>}
      </li>
    );
  };
  return (
    <ol className="relative mt-4 flex flex-col gap-5 before:absolute before:bottom-6 before:left-[17px] before:top-6 before:w-0.5 before:bg-white/15">
      {plan.pasos.map(linea)}
      <li className="relative pl-12">
        <span className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full bg-blue text-lg font-bold">B</span>
        <p className="font-semibold">Llegas ~ {hora(new Date(reloj))}</p>
      </li>
    </ol>
  );
}

export default function Viaje() {
  const [a, setA] = useState<Lugar | null>(null);
  const [b, setB] = useState<Lugar | null>(null);
  const [rutas, setRutas] = useState<RutaMapa[] | null>(null);
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [error, setError] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [ahora] = useState(() => new Date());
  const [trafico, setTrafico] = useState<Trafico | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setA(decodificarLugar(q.get("a")));
    setB(decodificarLugar(q.get("b")));
    cargarRutasMapa().then(setRutas).catch(() => setError(true));
    cargarIncidentes().then(setIncidentes).catch(() => {});
  }, []);

  // Con Google: cuánto más lento está el tráfico ahora; escala el tiempo de los buses
  useEffect(() => {
    if (a && b && hayGoogle) factorTrafico(a.pos, b.pos).then(setTrafico).catch(() => {});
  }, [a, b]);

  const base = useMemo(() => (rutas && a && b ? planificar(rutas, a.pos, b.pos, { ahora, factorTrafico: trafico?.factor }) : null), [rutas, a, b, ahora, trafico]);

  // Caminata real: reemplaza el cálculo en línea recta por el recorrido peatonal por calles
  const [conReales, setConReales] = useState<{ de: Plan[]; planes: Plan[] } | null>(null);
  useEffect(() => {
    if (!base?.length) return;
    let vigente = true;
    conCaminataReal(base).then((p) => vigente && setConReales({ de: base, planes: p }));
    return () => {
      vigente = false;
    };
  }, [base]);
  const reales = conReales && conReales.de === base ? conReales.planes : null;
  const planes = reales ?? (base ? base.slice(0, 6) : null);
  const ajustando = !!base?.length && !reales;

  useEffect(() => {
    if (planes?.length) setSel((s) => s ?? planes[0].id);
  }, [planes]);

  const actual = planes?.find((p) => p.id === sel) ?? null;
  const rutasMapa = useMemo(() => {
    const ids = new Set<string>();
    planes?.forEach((p) => p.pasos.forEach((s) => s.tipo === "bus" && ids.add(s.ruta.id)));
    return (rutas ?? []).filter((r) => ids.has(r.id));
  }, [planes, rutas]);

  const pico = esHoraPico(ahora);

  return (
    <main className="flex flex-1 flex-col md:flex-row">
      <div className="relative h-[42svh] shrink-0 md:order-2 md:sticky md:top-[72px] md:h-[calc(100svh-72px)] md:flex-1">
        <MapaAuto className="absolute inset-0" rutas={rutasMapa} selId={null} viaje={actual && a && b ? { a: a.pos, b: b.pos, pasos: actual.pasos } : null} />
      </div>

      <section className="hoja-in flex-1 px-4 pb-8 pt-5 md:w-[460px] md:flex-none md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-muted"><span className="grid h-6 w-6 place-items-center rounded-full bg-green text-xs font-bold text-white">A</span> Sales de</p>
            <h1 className="heading truncate text-[1.6rem]">{a?.nombre ?? "…"}</h1>
            <p className="mt-2 flex items-center gap-2 text-muted"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue text-xs font-bold text-white">B</span> Vas a</p>
            <p className="heading truncate text-[1.6rem]">{b?.nombre ?? "…"}</p>
          </div>
          <Link href="/" className="btn btn-ghost !min-h-11 !px-4 !text-base">
            Cambiar
          </Link>
        </div>

        <p className="mt-4 rounded-[var(--r)] bg-surface p-4 text-[0.95rem] leading-snug text-muted">
          {pico ? "Hora pico: los buses van más lentos." : "Hora valle: la circulación es más fluida."}{" "}
          {incidentes.length ? `Hay ${incidentes.length} reporte${incidentes.length > 1 ? "s" : ""} de trancones o cierres.` : "Sin trancones reportados."}{" "}
          {trafico ? `Tráfico ahora: ${trafico.nivel}.` : "Tiempos estimados; sin tráfico en vivo."}{" "}
          {ajustando ? "Ajustando el tiempo a pie por las calles reales…" : "El tiempo a pie sigue las calles por donde se puede caminar."}
        </p>

        {error && <p className="mt-6 text-red">No se pudieron cargar las rutas. Revisa tu conexión.</p>}

        {!planes && !error && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="skeleton h-36" />
            <div className="skeleton h-36" />
          </div>
        )}

        {planes && planes.length === 0 && (
          <div className="rise mt-6 rounded-[var(--r)] bg-surface-2 p-6">
            <p className="heading text-2xl">No encuentro cómo llegar en bus.</p>
            <p className="mt-2 text-lg text-muted">
              Ninguna ruta pasa cerca de uno de los dos puntos. Prueba con un punto sobre una avenida o mira el{" "}
              <Link href="/mapa/" className="text-yellow underline">mapa de rutas</Link>.
            </p>
          </div>
        )}

        <ul className="mt-6 flex flex-col gap-3">
          {planes?.map((p, i) => {
            const activa = p.id === sel;
            const llegada = new Date(ahora.getTime() + p.minTotal * 60000);
            const tarifa = pasajeTotal(p);
            const buses = p.pasos.filter((s): s is Extract<Paso, { tipo: "bus" }> => s.tipo === "bus");
            const reportes = incidentes.filter((x) => buses.some((s) => s.ruta.id === x.route_id));
            return (
              <li key={p.id} className="rise" style={{ ["--d" as string]: `${Math.min(i, 6) * 70}ms` }}>
                <div className={`rounded-[var(--r)] p-5 transition-colors ${activa ? "bg-surface-2 outline outline-[3px] outline-yellow" : "bg-surface"}`}>
                  <button onClick={() => setSel(p.id)} className="w-full text-left" aria-pressed={activa}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {p.etiquetas.map((e) => (
                            <span key={e} className="rounded-full bg-green px-2.5 py-0.5 text-xs font-semibold">{e}</span>
                          ))}
                          {p.transbordos > 0 && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">1 transbordo</span>}
                          {!p.enServicio && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">Fuera de servicio</span>}
                          {reportes.length > 0 && <span className="rounded-full bg-red px-2.5 py-0.5 text-xs font-semibold">Reporte activo</span>}
                        </div>
                        <Resumen plan={p} />
                      </div>
                      <span className="text-right">
                        <span className="display block text-[2.4rem]">{p.minTotal}</span>
                        <span className="block text-sm text-muted">min</span>
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[1.02rem]">
                      <span>
                        Llegas ~ <b className="font-semibold">{hora(llegada)}</b> · camina {Math.round(p.metrosCaminados / 10) * 10} m
                      </span>
                      <span className="font-semibold">{tarifa != null ? pesos(tarifa) : p.id === "caminar" ? "Gratis" : "—"}</span>
                    </div>
                  </button>
                  {activa && <Pasos plan={p} ahora={ahora} />}
                </div>
              </li>
            );
          })}
        </ul>

        {planes && planes.length > 0 && <p className="mt-5 text-sm text-muted">Buses del AMB. Los colores indican la flota; si la foto no coincide, confirma el número de ruta en el letrero.</p>}
      </section>
    </main>
  );
}
