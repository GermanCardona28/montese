"use client";

import { useEffect, useRef, useState } from "react";
import { cargarRutasMapa } from "@/lib/rutas";

function useConteo(objetivo: number, activo: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!activo || !objetivo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(objetivo);
      return;
    }
    const t0 = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const f = Math.min(1, (t - t0) / 1400);
      setV(Math.round(objetivo * (1 - Math.pow(1 - f, 3))));
      if (f < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [objetivo, activo]);
  return v;
}

/** Cifras reales calculadas desde la base de datos, en baldosas de colores desparejas. */
export default function Cifras() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [datos, setDatos] = useState({ rutas: 0, empresas: 0, desde: 0, km: 0 });

  useEffect(() => {
    cargarRutasMapa()
      .then((r) =>
        setDatos({
          rutas: r.length,
          empresas: new Set(r.map((x) => x.companies?.nombre)).size,
          desde: Math.min(...r.map((x) => x.tarifa_cop ?? Infinity)),
          km: Math.round(r.reduce((s, x) => s + (x.longitud_km ?? 0), 0)),
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const rutas = useConteo(datos.rutas, visible);
  const empresas = useConteo(datos.empresas, visible);
  const desde = useConteo(datos.desde === Infinity ? 0 : datos.desde, visible);
  const km = useConteo(datos.km, visible);

  const baldosa = "flex flex-col justify-between rounded-[var(--r)] p-5 md:p-6";
  return (
    <div ref={ref} className="grid gap-2 md:grid-cols-12 md:items-start">
      <div className={`${baldosa} min-h-[120px] bg-green text-white md:col-span-6 md:min-h-[420px]`}>
        <p className="display text-[clamp(3rem,16vw,9rem)]">{rutas}</p>
        <p className="mt-3 text-lg font-medium md:mt-6 md:text-xl">rutas con su trazado, horarios y tarifa.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:col-span-6 md:grid-cols-2 md:pt-16">
        <div className={`${baldosa} min-h-[120px] bg-yellow text-[#111] md:min-h-[300px]`}>
          <p className="display text-[clamp(2rem,10vw,5.5rem)]">{empresas}</p>
          <p className="mt-2 text-base font-medium md:mt-4 md:text-lg">empresas de buses</p>
        </div>
        <div className={`${baldosa} min-h-[120px] bg-blue text-white md:mt-24 md:min-h-[220px]`}>
          <p className="display text-[clamp(1.7rem,8vw,4rem)]">${desde.toLocaleString("es-CO")}</p>
          <p className="mt-2 text-base font-medium md:mt-4 md:text-lg">pasaje desde</p>
        </div>
        <div className={`${baldosa} col-span-2 min-h-[100px] bg-[#16724a] text-white md:col-span-2`}>
          <p className="display text-[clamp(2rem,10vw,5rem)]">{km.toLocaleString("es-CO")} km</p>
          <p className="mt-2 text-base font-medium md:text-lg">de recorridos mapeados en cuatro municipios</p>
        </div>
      </div>
    </div>
  );
}
