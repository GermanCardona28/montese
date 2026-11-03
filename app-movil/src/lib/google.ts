import type { LngLat } from "@/lib/geo";

/**
 * Servicios REST opcionales de Google (Places API New y Routes API).
 * Se activan solo si EXPO_PUBLIC_GOOGLE_API_KEY existe. Sin ella la búsqueda usa OpenStreetMap
 * y el tiempo de los buses se estima por hora del día.
 */
export const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? "";
export const hayGoogle = GOOGLE_KEY.length > 0;

// Área metropolitana de Bucaramanga (suroeste y noreste)
const ZONA = { low: { latitude: 6.93, longitude: -73.25 }, high: { latitude: 7.22, longitude: -72.98 } };

export type Sugerencia = { nombre: string; detalle: string; placeId: string };

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

export async function posicionGoogle(placeId: string): Promise<LngLat> {
  const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=es`, {
    headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "location" },
  });
  if (!r.ok) throw new Error("Places no disponible");
  const j = (await r.json()) as { location: { latitude: number; longitude: number } };
  return [j.location.longitude, j.location.latitude];
}

export type Trafico = { factor: number; nivel: "fluido" | "moderado" | "pesado" };

/** Cuánto más lento está el tráfico ahora que sin tráfico (conduciendo de A a B). */
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
