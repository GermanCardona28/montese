import type { LngLat } from "@/lib/geo";

/**
 * Estaciones y portales de Metrolínea donde se puede cambiar de bus. Las coordenadas salen de
 * OpenStreetMap. Una ruta "entra" a una estación cuando su trazado pasa a pocos metros de ella.
 */
export type Estacion = { nombre: string; pos: LngLat };

export const ESTACIONES: Estacion[] = [
  { nombre: "Portal del Norte", pos: [-73.1307, 7.14595] },
  { nombre: "Parque Estación UIS", pos: [-73.12222, 7.13717] },
  { nombre: "estación Quebradaseca", pos: [-73.12809, 7.12213] },
  { nombre: "estación San Mateo", pos: [-73.12667, 7.11859] },
  { nombre: "estación Chorreras", pos: [-73.12595, 7.11678] },
  { nombre: "estación La Rosita", pos: [-73.12185, 7.1125] },
  { nombre: "estación La Isla", pos: [-73.11607, 7.10787] },
  { nombre: "estación Diamante", pos: [-73.11048, 7.09535] },
  { nombre: "Portal de Provenza", pos: [-73.10925, 7.09065] },
  { nombre: "estación Hormigueros", pos: [-73.10808, 7.0788] },
  { nombre: "estación Molinos", pos: [-73.10822, 7.07527] },
  { nombre: "estación Cañaveral", pos: [-73.10469, 7.07047] },
  { nombre: "estación La Estancia", pos: [-73.0809, 7.04977] },
  { nombre: "estación Menzulí", pos: [-73.07758, 7.04369] },
  { nombre: "Portal de Piedecuesta", pos: [-73.05554, 7.00217] },
];
