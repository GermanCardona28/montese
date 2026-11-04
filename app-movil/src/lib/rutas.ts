import { supabase } from "@/lib/supabase";

export type EmpresaFlota = {
  nombre: string;
  tipo?: string;
  flota_colores: string[] | null;
  flota_descripcion: string | null;
  flota_confianza: string | null;
};

export type Horario = {
  primera_salida: string;
  ultima_salida: string;
  frecuencia_pico_min: number | null;
  frecuencia_valle_min: number | null;
};

export type Ruta = {
  id: string;
  codigo: string;
  nombre: string;
  terminal: string | null;
  resumen: string | null;
  longitud_km: number | null;
  tarifa_cop: number | null;
  estado: string;
  trazado_fuente: string | null;
  companies: EmpresaFlota | null;
  schedules: Horario[];
};

export type RutaMapa = Ruta & { trazado_polyline: string };

const EMPRESA = "companies(nombre,tipo,flota_colores,flota_descripcion,flota_confianza)";
const HORARIO = "schedules(primera_salida,ultima_salida,frecuencia_pico_min,frecuencia_valle_min)";
const BASE = `id,codigo,nombre,terminal,resumen,longitud_km,tarifa_cop,estado,trazado_fuente,${EMPRESA},${HORARIO}`;

const ordenar = <T extends { codigo: string }>(l: T[]) => l.sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true }));

let cacheLista: Promise<Ruta[]> | null = null;
/** Todas las rutas (incluidas las que aún no tienen trazado), sin geometría. */
export function cargarRutasLista(): Promise<Ruta[]> {
  cacheLista ??= (async () => {
    const { data, error } = await supabase.from("routes").select(BASE).eq("activa", true);
    if (error) {
      cacheLista = null;
      throw error;
    }
    return ordenar(data as unknown as Ruta[]);
  })();
  return cacheLista;
}

let cacheMapa: Promise<RutaMapa[]> | null = null;
/** Rutas con trazado, cargadas una sola vez por sesión. */
export function cargarRutasMapa(): Promise<RutaMapa[]> {
  cacheMapa ??= (async () => {
    const { data, error } = await supabase.from("routes").select(`${BASE},trazado_polyline`).eq("activa", true).not("trazado_polyline", "is", null);
    if (error) {
      cacheMapa = null;
      throw error;
    }
    return ordenar(data as unknown as RutaMapa[]);
  })();
  return cacheMapa;
}

export type Incidente = { route_id: string | null; tipo: string; descripcion: string | null };

/** Incidentes vigentes reportados (trancones, retrasos, cierres). */
export async function cargarIncidentes(): Promise<Incidente[]> {
  const { data } = await supabase.from("incidents").select("route_id,tipo,descripcion");
  return (data as Incidente[]) ?? [];
}

export type EmpresaResumen = EmpresaFlota & { id: string; routes: { count: number }[] };

export async function cargarEmpresas(): Promise<EmpresaResumen[]> {
  const { data } = await supabase
    .from("companies")
    .select("id,nombre,tipo,flota_colores,flota_descripcion,flota_confianza,routes(count)")
    .eq("routes.estado", "activa")
    .order("nombre");
  return (data as unknown as EmpresaResumen[]) ?? [];
}

// ---------- Color ----------

const PALETA = ["#E03131", "#1C7ED6", "#2F9E44", "#F08C00", "#AE3EC9", "#0CA678", "#F06595", "#4C6EF5", "#82C91E", "#15AABF", "#FA5252", "#7048E8"];

export function colorEmpresa(nombre: string) {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}

/** Color con el que se dibuja una ruta en el mapa: uno estable y distinto por empresa. */
export function colorRuta(r: { companies: EmpresaFlota | null }) {
  return colorEmpresa(r.companies?.nombre ?? "");
}

/** Colores a mostrar para reconocer el bus (principal y secundario). */
export function coloresBus(r: { companies: EmpresaFlota | null }): string[] {
  return r.companies?.flota_colores?.length ? r.companies.flota_colores : [colorEmpresa(r.companies?.nombre ?? "")];
}

// ---------- Geometría codificada ----------

/** Decodifica una polilínea de Google (precisión 5) a coordenadas [lng, lat]. */
export function decodificarPolilinea(s: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0, lat = 0, lng = 0;
  const leer = () => {
    let r = 0, shift = 0, b: number;
    do {
      b = s.charCodeAt(i++) - 63;
      r |= (b & 31) << shift;
      shift += 5;
    } while (b >= 32);
    return r & 1 ? ~(r >> 1) : r >> 1;
  };
  while (i < s.length) {
    lat += leer();
    lng += leer();
    out.push([lng / 1e5, lat / 1e5]);
  }
  return out;
}

// ---------- Horarios ----------

export function hhmm(t: string) {
  const [h, m] = t.split(":").map(Number);
  const sufijo = h >= 12 ? "p. m." : "a. m.";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${sufijo}`;
}

/** Horas pico estimadas (el AMB no publica la ventana exacta). */
export function esHoraPico(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  return (h >= 6 && h < 8.5) || (h >= 16.5 && h < 19.5);
}

export type Estado = { operando: boolean; frecuencia: number | null };

export function estadoAhora(r: { schedules: Horario[] }, d = new Date()): Estado {
  const s = r.schedules[0];
  if (!s) return { operando: false, frecuencia: null };
  const ahora = d.getHours() * 60 + d.getMinutes();
  const [h1, m1] = s.primera_salida.split(":").map(Number);
  const [h2, m2] = s.ultima_salida.split(":").map(Number);
  const operando = ahora >= h1 * 60 + m1 && ahora <= h2 * 60 + m2;
  return { operando, frecuencia: esHoraPico(d) ? s.frecuencia_pico_min : s.frecuencia_valle_min };
}
