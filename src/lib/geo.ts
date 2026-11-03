import { decodificarPolilinea, esHoraPico, estadoAhora, type RutaMapa } from "@/lib/rutas";

export type LngLat = [number, number];

const LAT0 = 7.1;
const K = 111320; // metros por grado de latitud
const COS = Math.cos((LAT0 * Math.PI) / 180);
const xy = (p: LngLat): [number, number] => [p[0] * K * COS, p[1] * K];

export function distancia(a: LngLat, b: LngLat) {
  const [ax, ay] = xy(a);
  const [bx, by] = xy(b);
  return Math.hypot(ax - bx, ay - by);
}

export type Linea = { coords: LngLat[]; cum: number[]; total: number };

export function prepararLinea(coords: LngLat[]): Linea {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + distancia(coords[i - 1], coords[i]));
  return { coords, cum, total: cum[cum.length - 1] };
}

const lineas = new Map<string, Linea>();
export function lineaDe(r: RutaMapa): Linea {
  let l = lineas.get(r.id);
  if (!l) {
    l = prepararLinea(decodificarPolilinea(r.trazado_polyline));
    lineas.set(r.id, l);
  }
  return l;
}

type Candidato = { s: number; d: number; punto: LngLat };

/** Puntos de la línea cercanos a `p` (uno por cada paso de la ruta que se acerca). */
export function candidatos(l: Linea, p: LngLat, radio: number): Candidato[] {
  const [px, py] = xy(p);
  const out: Candidato[] = [];
  let mejor: Candidato | null = null;
  for (let i = 0; i < l.coords.length - 1; i++) {
    const [ax, ay] = xy(l.coords[i]);
    const [bx, by] = xy(l.coords[i + 1]);
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d <= radio) {
      const c: Candidato = {
        s: l.cum[i] + t * (l.cum[i + 1] - l.cum[i]),
        d,
        punto: [l.coords[i][0] + t * (l.coords[i + 1][0] - l.coords[i][0]), l.coords[i][1] + t * (l.coords[i + 1][1] - l.coords[i][1])],
      };
      if (!mejor || c.d < mejor.d) mejor = c;
    } else if (mejor) {
      out.push(mejor);
      mejor = null;
    }
  }
  if (mejor) out.push(mejor);
  return out;
}

/** Punto de la línea a una distancia acumulada `s`. */
export function puntoEn(l: Linea, s: number): LngLat {
  let i = 0;
  while (i < l.cum.length - 2 && l.cum[i + 1] < s) i++;
  const seg = l.cum[i + 1] - l.cum[i] || 1;
  const t = Math.max(0, Math.min(1, (s - l.cum[i]) / seg));
  return [l.coords[i][0] + t * (l.coords[i + 1][0] - l.coords[i][0]), l.coords[i][1] + t * (l.coords[i + 1][1] - l.coords[i][1])];
}

/** Tramo de la línea entre dos distancias acumuladas. */
export function tramo(l: Linea, s1: number, s2: number): LngLat[] {
  const out: LngLat[] = [puntoEn(l, s1)];
  for (let i = 0; i < l.coords.length; i++) if (l.cum[i] > s1 && l.cum[i] < s2) out.push(l.coords[i]);
  out.push(puntoEn(l, s2));
  return out;
}

// ---------- Muestreo para buscar transbordos ----------

const PASO = 60; // m entre muestras
const CELDA = 250; // m, tamaño de la cuadrícula

type Muestras = { pts: { p: LngLat; s: number }[]; rejilla: Map<string, number[]> };
const cacheMuestras = new Map<string, Muestras>();

function muestras(r: RutaMapa): Muestras {
  let m = cacheMuestras.get(r.id);
  if (m) return m;
  const l = lineaDe(r);
  const pts: Muestras["pts"] = [];
  for (let s = 0; s <= l.total; s += PASO) pts.push({ p: puntoEn(l, s), s });
  const rejilla = new Map<string, number[]>();
  pts.forEach((q, i) => {
    const [x, y] = xy(q.p);
    const k = `${Math.floor(x / CELDA)},${Math.floor(y / CELDA)}`;
    (rejilla.get(k) ?? rejilla.set(k, []).get(k)!).push(i);
  });
  m = { pts, rejilla };
  cacheMuestras.set(r.id, m);
  return m;
}

function vecinos(m: Muestras, p: LngLat): number[] {
  const [x, y] = xy(p);
  const cx = Math.floor(x / CELDA), cy = Math.floor(y / CELDA);
  const out: number[] = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) out.push(...(m.rejilla.get(`${cx + i},${cy + j}`) ?? []));
  return out;
}

// ---------- Plan de viaje ----------

export type PasoCaminar = {
  tipo: "caminar";
  desde: LngLat;
  hasta: LngLat;
  metros: number;
  min: number;
  hacia: "ruta" | "transbordo" | "destino";
};

export type PasoBus = {
  tipo: "bus";
  ruta: RutaMapa;
  subida: LngLat;
  bajada: LngLat;
  metros: number;
  minEspera: number;
  minViaje: number;
  frecuencia: number | null;
  enServicio: boolean;
  tramo: LngLat[];
};

export type Paso = PasoCaminar | PasoBus;

export type Plan = {
  id: string;
  pasos: Paso[];
  minTotal: number;
  minCaminar: number;
  metrosCaminados: number;
  transbordos: number;
  enServicio: boolean;
  /** Metros que faltan a pie desde donde te baja el último bus hasta tu destino. */
  ultimaCaminata: number;
  etiquetas: string[];
};

// Supuestos del modelo (ajustables cuando haya datos reales de velocidad)
const CAMINAR_M_MIN = 75; // 4,5 km/h
const BUS_KMH = { pico: 11, valle: 16 };
const MAX_CAMINATA_TRANSBORDO = 300; // m entre dos rutas para transbordar
const PENALIZA_TRANSBORDO = 5; // min de molestia por cada transbordo

export type Opciones = { ahora?: Date; factorTrafico?: number };

export function planificar(rutas: RutaMapa[], a: LngLat, b: LngLat, op: Opciones = {}): Plan[] {
  const ahora = op.ahora ?? new Date();
  const factor = Math.max(1, op.factorTrafico ?? 1);
  const pico = esHoraPico(ahora);
  const mMin = (BUS_KMH[pico ? "pico" : "valle"] * 1000) / 60 / factor; // m de bus por minuto

  const unaVez = (radio: number) => {
    const planes: Plan[] = [];
    const info = rutas.map((ruta) => {
      const l = lineaDe(ruta);
      const est = estadoAhora(ruta, ahora);
      return { ruta, l, est, ca: candidatos(l, a, radio), cb: candidatos(l, b, radio) };
    });
    const espera = (f: number | null) => Math.round((f ?? 12) / 2);

    // 1. Caminar si está cerca
    const recto = distancia(a, b);
    if (recto <= 1500) {
      const m = Math.round(recto * 1.25);
      planes.push({
        id: "caminar",
        pasos: [{ tipo: "caminar", desde: a, hasta: b, metros: m, min: Math.max(1, Math.round(m / CAMINAR_M_MIN)), hacia: "destino" }],
        minTotal: Math.max(1, Math.round(m / CAMINAR_M_MIN)),
        minCaminar: Math.max(1, Math.round(m / CAMINAR_M_MIN)),
        metrosCaminados: m,
        transbordos: 0,
        enServicio: true,
        ultimaCaminata: m,
        etiquetas: [],
      });
    }

    // 2. Bus directo
    for (const { ruta, l, est, ca, cb } of info) {
      let mejor: { x: Candidato; y: Candidato; costo: number } | null = null;
      for (const x of ca)
        for (const y of cb) {
          if (y.s <= x.s + 50) continue;
          const costo = (x.d + y.d) / CAMINAR_M_MIN + (y.s - x.s) / mMin;
          if (!mejor || costo < mejor.costo) mejor = { x, y, costo };
        }
      if (!mejor) continue;
      const { x, y } = mejor;
      const minEspera = espera(est.frecuencia);
      const minViaje = Math.max(1, Math.round((y.s - x.s) / mMin));
      const w1 = Math.max(1, Math.round(x.d / CAMINAR_M_MIN)), w2 = Math.max(1, Math.round(y.d / CAMINAR_M_MIN));
      planes.push({
        id: `d-${ruta.id}`,
        pasos: [
          { tipo: "caminar", desde: a, hasta: x.punto, metros: Math.round(x.d), min: w1, hacia: "ruta" },
          { tipo: "bus", ruta, subida: x.punto, bajada: y.punto, metros: y.s - x.s, minEspera, minViaje, frecuencia: est.frecuencia, enServicio: est.operando, tramo: tramo(l, x.s, y.s) },
          { tipo: "caminar", desde: y.punto, hasta: b, metros: Math.round(y.d), min: w2, hacia: "destino" },
        ],
        minTotal: w1 + minEspera + minViaje + w2,
        minCaminar: w1 + w2,
        metrosCaminados: Math.round(x.d + y.d),
        transbordos: 0,
        enServicio: est.operando,
        ultimaCaminata: Math.round(y.d),
        etiquetas: [],
      });
    }

    // 3. Dos buses con transbordo a pie entre sus trazados
    const mejorDirecto = Math.min(...planes.filter((p) => p.transbordos === 0 && p.id !== "caminar").map((p) => p.minTotal), Infinity);
    const primeras = info.filter((i) => i.ca.length);
    const segundas = info.filter((i) => i.cb.length);
    const trans: Plan[] = [];
    for (const r1 of primeras) {
      for (const r2 of segundas) {
        if (r1.ruta.id === r2.ruta.id) continue;
        const m2 = muestras(r2.ruta);
        const sal = (s2: number) => {
          let b2: Candidato | null = null;
          for (const y of r2.cb) if (y.s > s2 + 50 && (!b2 || (y.s - s2) / mMin + y.d / CAMINAR_M_MIN < (b2.s - s2) / mMin + b2.d / CAMINAR_M_MIN)) b2 = y;
          return b2;
        };
        let mejor: { x: Candidato; s1: number; p1: LngLat; s2: number; p2: LngLat; y: Candidato; walkT: number; costo: number } | null = null;
        const m1 = muestras(r1.ruta);
        for (const x of r1.ca) {
          for (const q1 of m1.pts) {
            if (q1.s <= x.s + 200) continue;
            for (const j of vecinos(m2, q1.p)) {
              const q2 = m2.pts[j];
              const w = distancia(q1.p, q2.p);
              if (w > MAX_CAMINATA_TRANSBORDO) continue;
              const y = sal(q2.s);
              if (!y) continue;
              const costo =
                x.d / CAMINAR_M_MIN + espera(r1.est.frecuencia) + (q1.s - x.s) / mMin + w / CAMINAR_M_MIN + espera(r2.est.frecuencia) + (y.s - q2.s) / mMin + y.d / CAMINAR_M_MIN;
              if (!mejor || costo < mejor.costo) mejor = { x, s1: q1.s, p1: q1.p, s2: q2.s, p2: q2.p, y, walkT: w, costo };
            }
          }
        }
        if (!mejor) continue;
        const { x, y } = mejor;
        const w1 = Math.max(1, Math.round(x.d / CAMINAR_M_MIN)), wt = Math.max(1, Math.round(mejor.walkT / CAMINAR_M_MIN)), w2 = Math.max(1, Math.round(y.d / CAMINAR_M_MIN));
        const v1 = Math.max(1, Math.round((mejor.s1 - x.s) / mMin)), v2 = Math.max(1, Math.round((y.s - mejor.s2) / mMin));
        const e1 = espera(r1.est.frecuencia), e2 = espera(r2.est.frecuencia);
        trans.push({
          id: `t-${r1.ruta.id}-${r2.ruta.id}`,
          pasos: [
            { tipo: "caminar", desde: a, hasta: x.punto, metros: Math.round(x.d), min: w1, hacia: "ruta" },
            { tipo: "bus", ruta: r1.ruta, subida: x.punto, bajada: mejor.p1, metros: mejor.s1 - x.s, minEspera: e1, minViaje: v1, frecuencia: r1.est.frecuencia, enServicio: r1.est.operando, tramo: tramo(r1.l, x.s, mejor.s1) },
            { tipo: "caminar", desde: mejor.p1, hasta: mejor.p2, metros: Math.round(mejor.walkT), min: wt, hacia: "transbordo" },
            { tipo: "bus", ruta: r2.ruta, subida: mejor.p2, bajada: y.punto, metros: y.s - mejor.s2, minEspera: e2, minViaje: v2, frecuencia: r2.est.frecuencia, enServicio: r2.est.operando, tramo: tramo(r2.l, mejor.s2, y.s) },
            { tipo: "caminar", desde: y.punto, hasta: b, metros: Math.round(y.d), min: w2, hacia: "destino" },
          ],
          minTotal: w1 + e1 + v1 + wt + e2 + v2 + w2,
          minCaminar: w1 + wt + w2,
          metrosCaminados: Math.round(x.d + mejor.walkT + y.d),
          transbordos: 1,
          enServicio: r1.est.operando && r2.est.operando,
          ultimaCaminata: Math.round(y.d),
          etiquetas: [],
        });
      }
    }
    // los transbordos solo valen la pena si ahorran tiempo o no hay directo
    trans.sort((p, q) => p.minTotal + PENALIZA_TRANSBORDO - (q.minTotal + PENALIZA_TRANSBORDO));
    for (const t of trans.slice(0, 4)) if (mejorDirecto === Infinity || t.minTotal + PENALIZA_TRANSBORDO < mejorDirecto) planes.push(t);

    return planes;
  };

  let planes = unaVez(900);
  if (!planes.length) planes = unaVez(1600); // sin cobertura cercana: ofrece caminar más

  const puntaje = (p: Plan) => p.minTotal + p.transbordos * PENALIZA_TRANSBORDO;
  planes.sort((p, q) => Number(q.enServicio) - Number(p.enServicio) || puntaje(p) - puntaje(q));

  // etiquetas
  const ok = planes.filter((p) => p.enServicio);
  if (ok.length) {
    ok[0].etiquetas.push("Más rápida");
    if (ok.length > 1) {
      const cerca = [...ok].filter((p) => p.id !== "caminar").sort((p, q) => p.ultimaCaminata - q.ultimaCaminata)[0];
      if (cerca && !cerca.etiquetas.length) cerca.etiquetas.push("Te deja más cerca");
      const menos = [...ok].filter((p) => p.id !== "caminar").sort((p, q) => p.metrosCaminados - q.metrosCaminados)[0];
      if (menos && !menos.etiquetas.length) menos.etiquetas.push("Menos caminata");
    }
  }
  return planes.slice(0, 6);
}

/** Pasaje total de un plan, o null si alguna ruta no tiene tarifa. */
export function pasajeTotal(p: Plan): number | null {
  let t = 0;
  for (const s of p.pasos) {
    if (s.tipo !== "bus") continue;
    if (s.ruta.tarifa_cop == null) return null;
    t += s.ruta.tarifa_cop;
  }
  return t;
}
