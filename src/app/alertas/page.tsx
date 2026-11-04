"use client";

import { useEffect, useState } from "react";
import { cargarIncidentes, type Incidente } from "@/lib/rutas";
import BusCalle from "@/components/BusCalle";
import TraficoWaze from "@/components/TraficoWaze";

const TIPOS: Record<string, string> = {
  trancon: "Trancón",
  retraso: "Retraso",
  cierre_via: "Cierre de vía",
  accidente: "Accidente",
  otro: "Aviso",
};

export default function Alertas() {
  const [lista, setLista] = useState<Incidente[] | null>(null);

  useEffect(() => {
    cargarIncidentes().then(setLista).catch(() => setLista([]));
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 pt-8 md:px-6">
        <h1 className="display text-[clamp(4rem,19vw,9rem)]">
          <span className="mask"><span>Alertas</span></span>
        </h1>
        <p className="rise mt-3 max-w-[38ch] text-xl" style={{ ["--d" as string]: "400ms" }}>
          Trancones, retrasos y cierres reportados por la comunidad.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          {lista === null && <div className="skeleton h-28" />}
          {lista?.length === 0 && (
            <div className="rise rounded-[var(--r)] bg-green p-7 text-white" style={{ ["--d" as string]: "500ms" }}>
              <p className="heading text-[2rem]">Vía libre.</p>
              <p className="mt-2 text-lg">No hay reportes activos ahora mismo.</p>
            </div>
          )}
          {lista?.map((a, i) => (
            <div key={i} className="rise rounded-[var(--r)] bg-red p-6 text-white" style={{ ["--d" as string]: `${i * 60}ms` }}>
              <p className="heading text-2xl">{TIPOS[a.tipo] ?? "Aviso"}</p>
              {a.descripcion && <p className="mt-1 text-lg">{a.descripcion}</p>}
            </div>
          ))}
          <TraficoWaze />
          <div className="rounded-[var(--r)] bg-surface p-6">
            <p className="heading text-xl">Pronto podrás reportar.</p>
            <p className="mt-1 text-muted">
              Cuando termines tu viaje podrás avisar de un trancón o un retraso para ayudar a los demás.
            </p>
          </div>
        </div>
      </div>
      <BusCalle className="mt-12 h-[170px]" />
    </main>
  );
}
