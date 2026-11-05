import { createClient } from "@/lib/supabase/client";
import { decodificarPolilinea } from "@/lib/rutas";
import { distancia, ordenarYEtiquetar, recalcular, type LngLat, type PasoCaminar, type Plan } from "@/lib/geo";

/**
 * Caminata real: la función `caminata` de Supabase pide el recorrido peatonal (Google Routes si tiene la clave
 * configurada; si no, el enrutador peatonal de OpenStreetMap). Así el tiempo cuenta las calles, los puentes y
 * los cruces por los que de verdad se puede caminar, no solo la distancia en línea recta.
 */
export type CaminoReal = { metros: number; min: number; camino: LngLat[] };

const cache = new Map<string, Promise<CaminoReal | null>>();
const k = (p: LngLat) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;

export function caminoReal(a: LngLat, b: LngLat): Promise<CaminoReal | null> {
  const clave = `${k(a)}>${k(b)}`;
  let p = cache.get(clave);
  if (!p) {
    p = (async () => {
      try {
        const { data, error } = await createClient().functions.invoke("caminata", { body: { desde: a, hasta: b } });
        if (error || !data || typeof data.metros !== "number") return null;
        const camino = data.polilinea ? decodificarPolilinea(data.polilinea) : [a, b];
        return { metros: Math.round(data.metros), min: Math.max(1, Math.round(data.segundos / 60)), camino };
      } catch {
        return null;
      }
    })();
    cache.set(clave, p);
    // Si falló, que se pueda reintentar la próxima vez
    p.then((r) => r || cache.delete(clave));
  }
  return p;
}

/** Cambia el tiempo de cada caminata del plan por el real y vuelve a ordenar los planes. */
export async function conCaminataReal(original: Plan[], max = 6): Promise<Plan[]> {
  const planes = original.map((p) => ({ ...p, pasos: p.pasos.map((s) => ({ ...s })) })) as Plan[];
  const pendientes: { paso: PasoCaminar; plan: Plan }[] = [];
  for (const plan of planes) for (const paso of plan.pasos) if (paso.tipo === "caminar" && distancia(paso.desde, paso.hasta) > 30) pendientes.push({ paso, plan });

  // De cuatro en cuatro para no saturar el servicio
  for (let i = 0; i < pendientes.length; i += 4) {
    await Promise.all(
      pendientes.slice(i, i + 4).map(async ({ paso }) => {
        const r = await caminoReal(paso.desde, paso.hasta);
        if (r) {
          paso.metros = r.metros;
          paso.min = r.min;
          paso.camino = r.camino;
          paso.real = true;
        }
      })
    );
  }
  return ordenarYEtiquetar(planes.map(recalcular)).slice(0, max);
}
