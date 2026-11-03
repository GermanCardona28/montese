import * as Location from "expo-location";
import type { LngLat } from "@/lib/geo";
import { hayGoogle, posicionGoogle, sugerenciasGoogle } from "@/lib/google";

export type Lugar = { nombre: string; detalle: string; pos: LngLat; /** Solo con Google: falta pedir las coordenadas al elegirlo. */ placeId?: string };

// Área metropolitana de Bucaramanga: oeste, norte, este, sur
const VISTA = "-73.25,7.22,-72.98,6.93";

/** Búsqueda de direcciones y sitios (Google si hay clave; si no, Nominatim de OpenStreetMap). */
export async function buscarLugar(q: string, signal?: AbortSignal): Promise<Lugar[]> {
  if (hayGoogle) {
    const s = await sugerenciasGoogle(q, signal);
    return s.map((x) => ({ nombre: x.nombre, detalle: x.detalle, pos: [0, 0] as LngLat, placeId: x.placeId }));
  }
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=co&accept-language=es" +
    `&viewbox=${VISTA}&bounded=1&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { signal, headers: { "User-Agent": "Montese-app/0.1 (germanyecardona@gmail.com)" } });
  if (!r.ok) throw new Error("geocodificador no disponible");
  const data = (await r.json()) as { display_name: string; name?: string; lon: string; lat: string }[];
  return data.map((d) => {
    const partes = d.display_name.split(", ");
    return { nombre: d.name || partes[0], detalle: partes.slice(1, 3).join(", "), pos: [parseFloat(d.lon), parseFloat(d.lat)] as LngLat };
  });
}

/** Completa las coordenadas de un lugar sugerido por Google. */
export async function resolverLugar(l: Lugar): Promise<Lugar> {
  if (!l.placeId) return l;
  return { ...l, pos: await posicionGoogle(l.placeId), placeId: undefined };
}

/** Ubicación actual del teléfono (pide permiso la primera vez). */
export async function miUbicacion(): Promise<Lugar> {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (permiso.status !== "granted") throw new Error("Sin permiso de ubicación");
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { nombre: "Mi ubicación", detalle: "", pos: [p.coords.longitude, p.coords.latitude] };
}

/** Ubicación solo si el permiso ya fue concedido (no muestra ningún aviso). */
export async function miUbicacionSiHayPermiso(): Promise<Lugar | null> {
  const permiso = await Location.getForegroundPermissionsAsync();
  if (permiso.status !== "granted") return null;
  const p = await Location.getLastKnownPositionAsync();
  return p ? { nombre: "Mi ubicación", detalle: "", pos: [p.coords.longitude, p.coords.latitude] } : null;
}

export const codificarLugar = (l: Lugar) => `${l.pos[0].toFixed(5)},${l.pos[1].toFixed(5)},${encodeURIComponent(l.nombre)}`;

export function decodificarLugar(s: string | string[] | undefined): Lugar | null {
  const t = Array.isArray(s) ? s[0] : s;
  if (!t) return null;
  const [x, y, ...n] = t.split(",");
  const lng = parseFloat(x), lat = parseFloat(y);
  if (isNaN(lng) || isNaN(lat)) return null;
  return { nombre: decodeURIComponent(n.join(",")) || "Punto", detalle: "", pos: [lng, lat] };
}
