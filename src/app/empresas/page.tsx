"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BusColor, FlotaTexto } from "@/components/Flota";
import RutasLista from "@/components/RutasLista";
import { useReinicioPestana } from "@/lib/reinicio";
import type { EmpresaFlota } from "@/lib/rutas";

type Empresa = EmpresaFlota & { id: string; routes: { count: number }[] };

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  useReinicioPestana("/empresas/", () => {
    setSel(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  useEffect(() => {
    createClient()
      .from("companies")
      .select("id,nombre,tipo,flota_colores,flota_descripcion,flota_confianza,routes(count)")
      .eq("routes.estado", "activa")
      .order("nombre")
      .then(({ data }) => setEmpresas((data as unknown as Empresa[]) ?? []));
  }, []);

  if (sel)
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-6 md:px-6">
        <button onClick={() => setSel(null)} className="btn btn-ghost !min-h-11 !px-4 !text-base">
          ← Empresas
        </button>
        <h1 className="heading mb-5 mt-5 text-[clamp(1.8rem,6vw,2.6rem)]">{sel}</h1>
        <RutasLista empresa={sel} />
      </main>
    );

  const conRutas = (empresas ?? []).filter((e) => (e.routes[0]?.count ?? 0) > 0);
  const sinRutas = (empresas ?? []).filter((e) => !(e.routes[0]?.count ?? 0));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-2 pb-10 pt-8 md:px-4">
      <h1 className="display px-3 text-[clamp(3.2rem,15vw,8rem)]">
        <span className="mask"><span>Empresas</span></span>
      </h1>
      <p className="rise mb-6 mt-3 max-w-[40ch] px-3 text-lg md:text-xl" style={{ ["--d" as string]: "400ms" }}>
        Quién opera cada ruta y de qué color son sus buses.
      </p>

      {!empresas ? (
        <div className="grid gap-2 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {conRutas.map((e, i) => (
            <li key={e.id} className="rise" style={{ ["--d" as string]: `${Math.min(i, 8) * 50}ms` }}>
              <button
                onClick={() => setSel(e.nombre)}
                className="flex w-full items-center gap-4 rounded-[var(--r)] bg-surface p-4 text-left transition-colors hover:bg-surface-2 active:scale-[0.99]"
              >
                <BusColor empresa={e} size={84} />
                <span className="min-w-0 flex-1">
                  <span className="heading block text-[1.2rem]">{e.nombre}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {e.routes[0]?.count} rutas · <FlotaTexto empresa={e} />
                  </span>
                </span>
              </button>
            </li>
          ))}
          {sinRutas.map((e) => (
            <li key={e.id} className="rise md:col-span-2" style={{ ["--d" as string]: "500ms" }}>
              <div className="rounded-[var(--r)] bg-surface p-5">
                <p className="heading text-[1.2rem]">{e.nombre}</p>
                <p className="mt-1 text-muted">
                  {e.tipo === "masivo"
                    ? "Sin rutas verificadas: el sistema está en reestructuración y no hay un listado oficial vigente."
                    : "Rutas intermunicipales por verificar: aún no hay horarios ni trazados confirmados."}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="px-3 pt-6 text-sm text-muted">Los colores salen de fotos publicadas de cada flota; las marcadas “por confirmar” pueden variar.</p>
    </main>
  );
}
