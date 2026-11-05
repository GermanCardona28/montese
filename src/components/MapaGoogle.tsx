"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { colorRuta, type RutaMapa } from "@/lib/rutas";
import { lineaDe, prepararLinea, type LngLat } from "@/lib/geo";
import { cargarGoogle, GOOGLE_MAP_ID } from "@/lib/google";
import type { ViajeMapa } from "@/components/MapaRutas";

type Props = {
  rutas: RutaMapa[];
  selId: string | null;
  onSelect?: (id: string | null) => void;
  viaje?: ViajeMapa | null;
  className?: string;
};

const ll = (p: LngLat) => ({ lat: p[1], lng: p[0] });
const MINI_BUS = `<svg viewBox="0 0 64 64" width="46" height="46"><rect x="8" y="8" width="48" height="46" rx="12" fill="#ffd500" stroke="#191919" stroke-width="3"/><rect x="16" y="13" width="32" height="8" rx="4" fill="#1f9d55"/><path d="M14 46V27h8l10 10 10-10h8v19h-7v-9.5L32 47l-11-10.5V46Z" fill="#1f9d55"/><circle cx="17" cy="52" r="3.2" fill="#fff"/><circle cx="47" cy="52" r="3.2" fill="#fff"/><rect x="13" y="54" width="11" height="7" rx="3" fill="#191919"/><rect x="40" y="54" width="11" height="7" rx="3" fill="#191919"/></svg>`;

function chip(texto: string, fondo: string, ancho = 38) {
  const el = document.createElement("div");
  el.className = "marcador";
  Object.assign(el.style, { background: fondo, width: `${ancho}px`, borderRadius: ancho > 40 ? "14px" : "999px", border: "3px solid #fff" });
  el.textContent = texto;
  return el;
}

/** Mismo mapa que MapaRutas pero sobre Google Maps (con capa de tráfico en vivo). */
export default function MapaGoogle({ rutas, selId, onSelect, viaje, className = "" }: Props) {
  const cont = useRef<HTMLDivElement>(null);
  const mapa = useRef<any>(null);
  const lineas = useRef<Map<string, any>>(new Map());
  const extras = useRef<any[]>([]);
  const bus = useRef<any>(null);
  const raf = useRef(0);
  const trafico = useRef<any>(null);
  const alSeleccionar = useRef(onSelect);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(false);
  const [conTrafico, setConTrafico] = useState(false);

  useEffect(() => {
    alSeleccionar.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let vivo = true;
    cargarGoogle()
      .then(async () => {
        const g = (window as any).google;
        const { Map } = await g.maps.importLibrary("maps");
        await g.maps.importLibrary("marker");
        if (!vivo || !cont.current) return;
        mapa.current = new Map(cont.current, {
          center: { lat: 7.1, lng: -73.1 },
          zoom: 11,
          mapId: GOOGLE_MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        mapa.current.addListener("click", () => alSeleccionar.current?.(null));
        trafico.current = new g.maps.TrafficLayer();
        setListo(true);
      })
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
      cancelAnimationFrame(raf.current);
    };
  }, []);

  useEffect(() => {
    trafico.current?.setMap(conTrafico ? mapa.current : null);
  }, [conTrafico, listo]);

  // Líneas de las rutas
  useEffect(() => {
    if (!listo) return;
    const g = (window as any).google;
    for (const l of lineas.current.values()) l.forEach((p: any) => p.setMap(null));
    lineas.current.clear();
    const bounds = new g.maps.LatLngBounds();
    for (const r of rutas) {
      const path = lineaDe(r).coords.map(ll);
      const vis = new g.maps.Polyline({ path, strokeColor: colorRuta(r), strokeWeight: 4, strokeOpacity: 0.75, map: mapa.current, zIndex: 1 });
      const hit = new g.maps.Polyline({ path, strokeColor: "#000", strokeWeight: 22, strokeOpacity: 0, map: mapa.current, zIndex: 2 });
      hit.addListener("click", () => alSeleccionar.current?.(r.id));
      lineas.current.set(r.id, [vis, hit]);
      path.forEach((p) => bounds.extend(p));
    }
    if (rutas.length && !selId && !viaje) mapa.current.fitBounds(bounds, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutas, listo]);

  // Resaltado, viaje y bus animado
  useEffect(() => {
    if (!listo) return;
    const g = (window as any).google;
    const map = mapa.current;
    for (const [id, [vis]] of lineas.current.entries()) {
      const activa = selId === id;
      vis.setOptions({ strokeWeight: activa ? 8 : 4, strokeOpacity: selId || viaje ? (activa ? 1 : 0.14) : 0.75, zIndex: activa ? 5 : 1 });
    }
    extras.current.forEach((o) => (o.setMap ? o.setMap(null) : (o.map = null)));
    extras.current = [];
    if (bus.current) bus.current.map = null;
    bus.current = null;
    cancelAnimationFrame(raf.current);

    const marca = (p: LngLat, contenido: HTMLElement) => extras.current.push(new g.maps.marker.AdvancedMarkerElement({ map, position: ll(p), content: contenido }));
    let recorrido: LngLat[] | null = null;
    const sel = rutas.find((r) => r.id === selId);

    if (viaje) {
      const b = new g.maps.LatLngBounds();
      for (const p of viaje.pasos) {
        if (p.tipo === "caminar") {
          extras.current.push(
            new g.maps.Polyline({
              path: (p.camino ?? [p.desde, p.hasta]).map(ll),
              strokeOpacity: 0,
              icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: "#191919", scale: 3 }, offset: "0", repeat: "14px" }],
              map,
              zIndex: 6,
            })
          );
        } else {
          const path = p.tramo.map(ll);
          extras.current.push(new g.maps.Polyline({ path, strokeColor: colorRuta(p.ruta), strokeWeight: 7.5, map, zIndex: 8 }));
          marca(p.subida, chip(p.ruta.codigo, "#191919", 54));
          path.forEach((q) => b.extend(q));
        }
      }
      marca(viaje.a, chip("A", "#1f9d55"));
      marca(viaje.b, chip("B", "#1e6fd9"));
      b.extend(ll(viaje.a));
      b.extend(ll(viaje.b));
      map.fitBounds(b, { top: 70, bottom: 70, left: 50, right: 50 });
      recorrido = viaje.pasos.flatMap((p) => (p.tipo === "bus" ? p.tramo : []));
    } else if (sel) {
      const coords = lineaDe(sel).coords;
      const path = coords.map(ll);
      const b = new g.maps.LatLngBounds();
      path.forEach((p) => b.extend(p));
      map.fitBounds(b, { top: 60, bottom: 60, left: 40, right: 40 });
      recorrido = coords;
    }

    if (recorrido && recorrido.length > 1) {
      const linea = prepararLinea(recorrido);
      const el = document.createElement("div");
      el.innerHTML = MINI_BUS;
      const m = new g.maps.marker.AdvancedMarkerElement({ map, position: ll(recorrido[0]), content: el, zIndex: 20 });
      bus.current = m;
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const DURACION = Math.min(16000, Math.max(7000, linea.total / 2.2));
      const t0 = performance.now();
      const paso = (t: number) => {
        const s = (reducir ? 0 : ((t - t0) % DURACION) / DURACION) * linea.total;
        let i = 0;
        while (i < linea.cum.length - 2 && linea.cum[i + 1] < s) i++;
        const seg = linea.cum[i + 1] - linea.cum[i] || 1;
        const u = Math.max(0, Math.min(1, (s - linea.cum[i]) / seg));
        m.position = {
          lng: linea.coords[i][0] + u * (linea.coords[i + 1][0] - linea.coords[i][0]),
          lat: linea.coords[i][1] + u * (linea.coords[i + 1][1] - linea.coords[i][1]),
        };
        if (!reducir) raf.current = requestAnimationFrame(paso);
      };
      raf.current = requestAnimationFrame(paso);
    }
  }, [selId, viaje, rutas, listo]);

  return (
    <div className={className}>
      <div ref={cont} className="h-full w-full" />
      {listo && (
        <button
          onClick={() => setConTrafico((v) => !v)}
          aria-pressed={conTrafico}
          className={`btn absolute left-3 top-3 !min-h-10 !px-4 !text-sm ${conTrafico ? "btn-yellow" : "btn-dark"}`}
        >
          Tráfico en vivo
        </button>
      )}
      {error && <p className="absolute inset-0 grid place-items-center bg-bg p-6 text-center text-red">No se pudo cargar Google Maps. Revisa la clave y las APIs habilitadas.</p>}
    </div>
  );
}
