"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { colorRuta, type RutaMapa } from "@/lib/rutas";
import { lineaDe, prepararLinea, type LngLat, type Paso } from "@/lib/geo";

export type ViajeMapa = { a: LngLat; b: LngLat; pasos: Paso[] };

type Props = {
  rutas: RutaMapa[];
  selId: string | null;
  onSelect?: (id: string | null) => void;
  viaje?: ViajeMapa | null;
  className?: string;
};

const CENTRO: LngLat = [-73.1, 7.1];
const MINI_BUS = `<svg viewBox="0 0 64 64" width="46" height="46"><rect x="8" y="8" width="48" height="46" rx="12" fill="#ffd500" stroke="#191919" stroke-width="3"/><rect x="16" y="13" width="32" height="8" rx="4" fill="#1f9d55"/><path d="M14 46V27h8l10 10 10-10h8v19h-7v-9.5L32 47l-11-10.5V46Z" fill="#1f9d55"/><circle cx="17" cy="52" r="3.2" fill="#fff"/><circle cx="47" cy="52" r="3.2" fill="#fff"/><rect x="13" y="54" width="11" height="7" rx="3" fill="#191919"/><rect x="40" y="54" width="11" height="7" rx="3" fill="#191919"/></svg>`;

function marcador(texto: string, fondo: string, ancho = 38) {
  // el contenedor lo posiciona MapLibre; la animación vive en el interior para no pisar su transform
  const el = document.createElement("div");
  const dentro = document.createElement("div");
  dentro.className = "marcador";
  dentro.style.background = fondo;
  dentro.style.width = `${ancho}px`;
  dentro.style.borderRadius = ancho > 40 ? "14px" : "999px";
  dentro.style.border = "3px solid #fff";
  dentro.textContent = texto;
  el.appendChild(dentro);
  return el;
}

/** Mapa de rutas: líneas con el color de cada flota, clic para ver una ruta completa, viaje A→B y un bus que recorre el trazado. */
/** Grosor según el zoom: de lejos, hilos finos; de cerca, el grosor normal (k = 2 para la ruta elegida) */
const ANCHO = (k: number): any => ["interpolate", ["linear"], ["zoom"], 10, 1 * k, 15, 3.5 * k];

export default function MapaRutas({ rutas, selId, onSelect, viaje, className = "" }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const capas = useRef<string[]>([]);
  const marcadores = useRef<maplibregl.Marker[]>([]);
  const bus = useRef<maplibregl.Marker | null>(null);
  const raf = useRef<number>(0);
  const alSeleccionar = useRef(onSelect);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    alSeleccionar.current = onSelect;
  }, [onSelect]);

  // Mapa: se crea una vez
  useEffect(() => {
    if (!contenedor.current) return;
    // El worker empaquetado por Turbopack no carga; se sirve como archivo estático (public/maplibre).
    maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    const map = new maplibregl.Map({
      container: contenedor.current,
      center: CENTRO,
      zoom: 11,
      attributionControl: { compact: true },
      style: {
        version: 8,
        sources: {
          base: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "base", type: "raster", source: "base", paint: { "raster-saturation": -0.25, "raster-brightness-max": 0.92 } }],
      },
    });
    mapa.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), "top-right");

    // Clic o toque sobre una ruta (con tolerancia de 14 px para el dedo)
    map.on("click", (e) => {
      const ids = capas.current.filter((id) => id.startsWith("hit-") && map.getLayer(id));
      if (!ids.length) return;
      const caja: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 14, e.point.y - 14],
        [e.point.x + 14, e.point.y + 14],
      ];
      const f = map.queryRenderedFeatures(caja, { layers: ids });
      const id = f[0]?.layer.id.replace("hit-", "");
      alSeleccionar.current?.(id ?? null);
    });
    map.on("mousemove", (e) => {
      const ids = capas.current.filter((id) => id.startsWith("hit-") && map.getLayer(id));
      const f = ids.length ? map.queryRenderedFeatures([[e.point.x - 10, e.point.y - 10], [e.point.x + 10, e.point.y + 10]], { layers: ids }) : [];
      map.getCanvas().style.cursor = f.length ? "pointer" : "";
    });
    map.on("load", () => setListo(true));
    return () => {
      cancelAnimationFrame(raf.current);
      map.remove();
      mapa.current = null;
      setListo(false);
    };
  }, []);

  // Líneas de las rutas
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;
    // primero las capas, después las fuentes que usan
    for (const id of capas.current) if (map.getLayer(id)) map.removeLayer(id);
    for (const id of capas.current) if (map.getSource(id)) map.removeSource(id);
    capas.current = [];
    const bounds = new maplibregl.LngLatBounds();
    for (const r of rutas) {
      const src = `ruta-${r.id}`;
      const coords = lineaDe(r).coords;
      map.addSource(src, { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } } });
      map.addLayer({
        id: src,
        type: "line",
        source: src,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colorRuta(r), "line-width": ANCHO(1), "line-opacity": 0.75 },
      });
      // capa ancha e invisible para que se pueda tocar la ruta con el dedo
      map.addLayer({
        id: `hit-${r.id}`,
        type: "line",
        source: src,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#000", "line-width": 22, "line-opacity": 0 },
      });
      capas.current.push(src, `hit-${r.id}`);
      for (const p of coords) bounds.extend(p);
    }
    if (!bounds.isEmpty() && !selId && !viaje) map.fitBounds(bounds, { padding: 30, duration: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutas, listo]);

  // Resaltado, viaje y bus animado
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;

    const enViaje = !!viaje;
    for (const r of rutas) {
      const id = `ruta-${r.id}`;
      if (!map.getLayer(id)) continue;
      const activa = selId === r.id;
      map.setPaintProperty(id, "line-width", ANCHO(activa ? 2 : 1));
      map.setPaintProperty(id, "line-opacity", (selId || enViaje) && !activa ? 0.08 : 0.75);
      if (activa) map.moveLayer(id);
    }

    // limpiar lo anterior
    for (const m of marcadores.current) m.remove();
    marcadores.current = [];
    bus.current?.remove();
    bus.current = null;
    cancelAnimationFrame(raf.current);
    for (const id of ["viaje-camina", "sel-casing"]) {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    }
    for (const id of map.getStyle().layers.map((l) => l.id).filter((l) => l.startsWith("viaje-bus-"))) map.removeLayer(id);
    for (const id of Object.keys(map.getStyle().sources).filter((s) => s.startsWith("viaje-bus-"))) map.removeSource(id);

    let recorrido: LngLat[] | null = null;
    const sel = rutas.find((r) => r.id === selId);

    if (viaje) {
      const camina = viaje.pasos.filter((p) => p.tipo === "caminar");
      map.addSource("viaje-camina", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: camina.map((p) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: p.camino ?? [p.desde, p.hasta] } })),
        },
      });
      map.addLayer({ id: "viaje-camina", type: "line", source: "viaje-camina", paint: { "line-color": "#191919", "line-width": 4.5, "line-dasharray": [1, 1.6] } });

      const todos: LngLat[] = [viaje.a, viaje.b];
      const buses = viaje.pasos.filter((p) => p.tipo === "bus");
      buses.forEach((p, i) => {
        const fuente = `viaje-bus-${i}`;
        map.addSource(fuente, { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: p.tramo } } });
        map.addLayer({ id: fuente, type: "line", source: fuente, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": colorRuta(p.ruta), "line-width": 7.5 } });
        todos.push(...p.tramo);
        marcadores.current.push(new maplibregl.Marker({ element: marcador(p.ruta.codigo, "#191919", 54) }).setLngLat(p.subida).addTo(map));
        if (i === buses.length - 1 || buses.length > 1) {
          const el = marcador("", "#fff", 20);
          const punto = el.firstElementChild as HTMLElement;
          punto.style.height = "20px";
          punto.style.border = "4px solid #191919";
          marcadores.current.push(new maplibregl.Marker({ element: el }).setLngLat(p.bajada).addTo(map));
        }
      });
      marcadores.current.push(new maplibregl.Marker({ element: marcador("A", "#1f9d55") }).setLngLat(viaje.a).addTo(map));
      marcadores.current.push(new maplibregl.Marker({ element: marcador("B", "#1e6fd9") }).setLngLat(viaje.b).addTo(map));
      const b = new maplibregl.LngLatBounds(viaje.a, viaje.a);
      for (const p of todos) b.extend(p);
      map.fitBounds(b, { padding: { top: 70, bottom: 70, left: 50, right: 50 }, duration: 800, maxZoom: 16 });
      recorrido = buses.flatMap((p) => p.tramo);
    } else if (sel) {
      // ruta completa, sin borde ni sombra
      const coords = lineaDe(sel).coords;
      const b = new maplibregl.LngLatBounds();
      for (const p of coords) b.extend(p);
      map.fitBounds(b, { padding: { top: 60, bottom: 60, left: 40, right: 40 }, duration: 900 });
      recorrido = coords;
    }

    // bus que recorre el trazado en bucle
    if (recorrido && recorrido.length > 1) {
      const linea = prepararLinea(recorrido);
      const el = document.createElement("div");
      el.className = "marcador-bus";
      el.innerHTML = MINI_BUS;
      const m = new maplibregl.Marker({ element: el }).setLngLat(recorrido[0]).addTo(map);
      bus.current = m;
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const DURACION = Math.min(16000, Math.max(7000, linea.total / 2.2)); // más larga la ruta, más dura la vuelta
      const t0 = performance.now();
      const paso = (t: number) => {
        const f = reducir ? 0 : ((t - t0) % DURACION) / DURACION;
        const s = f * linea.total;
        let i = 0;
        while (i < linea.cum.length - 2 && linea.cum[i + 1] < s) i++;
        const seg = linea.cum[i + 1] - linea.cum[i] || 1;
        const u = Math.max(0, Math.min(1, (s - linea.cum[i]) / seg));
        m.setLngLat([
          linea.coords[i][0] + u * (linea.coords[i + 1][0] - linea.coords[i][0]),
          linea.coords[i][1] + u * (linea.coords[i + 1][1] - linea.coords[i][1]),
        ]);
        if (!reducir) raf.current = requestAnimationFrame(paso);
      };
      raf.current = requestAnimationFrame(paso);
    }
  }, [selId, viaje, rutas, listo]);

  // MapLibre fuerza position:relative en su contenedor; por eso el mapa vive dentro de un envoltorio con las medidas.
  return (
    <div className={className}>
      <div ref={contenedor} className="h-full w-full" />
    </div>
  );
}
