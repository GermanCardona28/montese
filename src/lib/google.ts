import type { LngLat } from "@/lib/geo";

/**
 * Integración opcional con Google Maps Platform.
 * Se activa solo si existe NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; sin clave la app usa OpenStreetMap.
 * APIs que deben estar habilitadas en el proyecto de Google Cloud: Maps JavaScript API,
 * Places API (New) y Routes API. La clave debe restringirse por sitio web / aplicación Android.
 */
export const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
export const hayGoogle = GOOGLE_KEY.length > 0;
export const GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID";

// Área metropolitana de Bucaramanga (suroeste y noreste)
const ZONA = { low: { latitude: 6.93, longitude: -73.25 }, high: { latitude: 7.22, longitude: -72.98 } };

let carga: Promise<void> | null = null;

/** Carga el script de Maps JavaScript API una sola vez. */
export function cargarGoogle(): Promise<void> {
  if (!hayGoogle) return Promise.reject(new Error("Sin clave de Google Maps"));
  carga ??= new Promise<void>((ok, no) => {
    const w = window as unknown as { __gmapsListo?: () => void; google?: unknown };
    if (w.google) return ok();
    w.__gmapsListo = () => ok();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&v=weekly&loading=async&language=es&region=CO&callback=__gmapsListo`;
    s.async = true;
    s.onerror = () => {
      carga = null;
      no(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(s);
  });
  return carga;
}

export type Sugerencia = { nombre: string; detalle: string; placeId: string };

/** Sugerencias de lugares con Places API (New), limitadas al área metropolitana. */
export async function sugerenciasGoogle(q: string, signal?: AbortSignal): Promise<Sugerencia[]> {
  const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({ input: q, languageCode: "es", includedRegionCodes: ["co"], locationRestriction: { rectangle: ZONA } }),
  });
  if (!r.ok) throw new Error("Places no disponible");
  const j = (await r.json()) as {
    suggestions?: { placePrediction: { placeId: string; structuredFormat: { mainText: { text: string }; secondaryText?: { text: string } } } }[];
  };
  return (j.suggestions ?? []).map((s) => ({
    placeId: s.placePrediction.placeId,
    nombre: s.placePrediction.structuredFormat.mainText.text,
    detalle: s.placePrediction.structuredFormat.secondaryText?.text ?? "",
  }));
}

/** Coordenadas de un lugar elegido. */
export async function posicionGoogle(placeId: string): Promise<LngLat> {
  const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=es`, {
    headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "location" },
  });
  if (!r.ok) throw new Error("Places no disponible");
  const j = (await r.json()) as { location: { latitude: number; longitude: number } };
  return [j.location.longitude, j.location.latitude];
}

export type Trafico = { factor: number; nivel: "fluido" | "moderado" | "pesado" };

/**
 * Cuánto más lento está el tráfico ahora que sin tráfico (conduciendo de A a B), con Routes API.
 * Sirve para escalar el tiempo de los buses; no es la velocidad real de cada ruta.
 */
export async function factorTrafico(a: LngLat, b: LngLat): Promise<Trafico | null> {
  if (!hayGoogle) return null;
  const punto = (p: LngLat) => ({ location: { latLng: { latitude: p[1], longitude: p[0] } } });
  const r = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "routes.duration,routes.staticDuration" },
    body: JSON.stringify({ origin: punto(a), destination: punto(b), travelMode: "DRIVE", routingPreference: "TRAFFIC_AWARE" }),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { routes?: { duration: string; staticDuration: string }[] };
  const ruta = j.routes?.[0];
  if (!ruta) return null;
  const factor = Math.max(1, parseInt(ruta.duration) / Math.max(1, parseInt(ruta.staticDuration)));
  return { factor, nivel: factor < 1.15 ? "fluido" : factor < 1.5 ? "moderado" : "pesado" };
}
