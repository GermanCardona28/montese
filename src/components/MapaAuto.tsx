"use client";

import MapaRutas, { type ViajeMapa } from "@/components/MapaRutas";
import MapaGoogle from "@/components/MapaGoogle";
import { hayGoogle } from "@/lib/google";
import type { RutaMapa } from "@/lib/rutas";

type Props = {
  rutas: RutaMapa[];
  selId: string | null;
  onSelect?: (id: string | null) => void;
  viaje?: ViajeMapa | null;
  className?: string;
};

/** Usa Google Maps si hay clave configurada; si no, OpenStreetMap con MapLibre. */
export default function MapaAuto(props: Props) {
  return hayGoogle ? <MapaGoogle {...props} /> : <MapaRutas {...props} />;
}
