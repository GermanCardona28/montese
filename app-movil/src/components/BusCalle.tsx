import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { C } from "@/theme";

/**
 * Escena animada (ciclo de 20 s). La cámara sigue al bus: el bus queda fijo y el mundo (edificios, línea de
 * la carretera) se desplaza hacia atrás. A los 5 s aparece el semáforo en rojo con el pato, la mujer y el
 * hombre esperando; cuando se enciende la luz peatonal cruzan y se quedan quietos al otro lado. Luego el
 * semáforo se pone en verde, el bus arranca, sale de la escena y el ciclo vuelve a empezar.
 * Un solo reloj (0→1) mueve todo, así las piezas siempre quedan sincronizadas.
 */

const CICLO = 20000;
const ALTO_ESCENA = 260; // unidades de la escena (ancho 1200)
const ANCHO_ESCENA = 1200;

// amarillo: 0 → el semáforo ya está en amarillo al acercarse el bus; camIni = rojo + 1 s (luz peatonal)
const T = { frena: 0.25, arranca: 0.6, acelera: 0.7, amarillo: 0, rojo: 0.21, verde: 0.56, camIni: 0.26, camFin: 0.5 };
const S_PARADA = 500;
const S_ARRANQUE = 700;
const S_TOTAL = 2500;
const MOSAICO = 1250;
const PERIODO_LINEA = 125;
const X_BUS = 480;
const X_SEMAFORO = 1250;
const GRADOS_PX = 4;
const Y_ATRAS = 168;
const Y_FRENTE = 252;
const ANCHO_MUNDO = 3900;

type Rango = { entradas: number[]; salidas: number[] };

/** Aproxima una curva de aceleración con tramos lineales para usar un solo reloj. */
function curva(desde: number, hasta: number, t0: number, t1: number, f: (u: number) => number, n = 10): Rango {
  const entradas: number[] = [], salidas: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    entradas.push(t0 + (t1 - t0) * u);
    salidas.push(desde + (hasta - desde) * f(u));
  }
  return { entradas, salidas };
}
const frenar = (u: number) => 1 - Math.pow(1 - u, 3); // sale rápido, llega suave
const arrancar = (u: number) => Math.pow(u, 3); // sale suave, termina rápido
const lineal = (u: number) => u;

function unir(...c: Rango[]): Rango {
  const entradas: number[] = [], salidas: number[] = [];
  c.forEach((x) => {
    x.entradas.forEach((e, j) => {
      if (entradas.length && e === entradas[entradas.length - 1]) return;
      entradas.push(e);
      salidas.push(x.salidas[j]);
    });
  });
  return { entradas, salidas };
}

/** Recorrido acumulado del mundo (en unidades) según el reloj. */
function recorrido(k = 1): Rango {
  return unir(
    curva(0, S_PARADA * k, 0, T.frena, frenar),
    { entradas: [T.frena, T.arranca], salidas: [S_PARADA * k, S_PARADA * k] },
    curva(S_PARADA * k, S_ARRANQUE * k, T.arranca, T.acelera, arrancar),
    curva(S_ARRANQUE * k, S_TOTAL * k, T.acelera, 1, lineal, 2)
  );
}

/** Valor `a`, que pasa a `b` entre `c1` y `c2` y vuelve a `a`. */
function escalon(a: number, b: number, c1: number, c2: number): Rango {
  const e = 0.0001;
  return { entradas: [0, c1 - e, c1, c2 - e, c2, 1], salidas: [a, a, b, b, a, a] };
}

const PERSONAS = [
  { id: "pato", x: 30, ini: T.camIni, fin: T.camIni + 0.17 },
  { id: "mujer", x: 66, ini: T.camIni + 0.01, fin: T.camIni + 0.19 },
  { id: "hombre", x: 102, ini: T.camIni + 0.02, fin: T.camIni + 0.21 },
] as const;

function Pato() {
  return (
    <G>
      <Ellipse cx={0} cy={-10} rx={9} ry={7} fill="#ffd500" />
      <Ellipse cx={-9} cy={-10} rx={2.6} ry={5} fill="#f2b705" />
      <Ellipse cx={9} cy={-10} rx={2.6} ry={5} fill="#f2b705" />
      <Circle cx={0} cy={-20} r={6} fill="#ffd500" />
      <Ellipse cx={0} cy={-17.5} rx={4} ry={2.4} fill="#f08c00" />
      <Circle cx={-2.6} cy={-21} r={1} fill="#111" />
      <Circle cx={2.6} cy={-21} r={1} fill="#111" />
      <Ellipse cx={-3.4} cy={-1} rx={3.4} ry={1.5} fill="#f08c00" />
      <Ellipse cx={3.4} cy={-1} rx={3.4} ry={1.5} fill="#f08c00" />
    </G>
  );
}

function Mujer() {
  return (
    <G>
      <Rect x={-5} y={-14} width={4} height={14} fill="#e0a97a" />
      <Rect x={1} y={-14} width={4} height={14} fill="#e0a97a" />
      <Rect x={-11} y={-33} width={3} height={13} rx={1.5} fill="#e0a97a" />
      <Rect x={8} y={-33} width={3} height={13} rx={1.5} fill="#e0a97a" />
      <Path d="M-9 -14 L-6 -35 L6 -35 L9 -14 Z" fill="#f06aa8" />
      <Rect x={-7.4} y={-46} width={3.4} height={17} rx={1.7} fill="#2b1d16" />
      <Rect x={4} y={-46} width={3.4} height={17} rx={1.7} fill="#2b1d16" />
      <Circle cx={0} cy={-41} r={7} fill="#2b1d16" />
      <Circle cx={0} cy={-39.5} r={5.6} fill="#e0a97a" />
    </G>
  );
}

function Hombre() {
  return (
    <G>
      <Rect x={-5.2} y={-16} width={4.4} height={16} fill="#2f3640" />
      <Rect x={0.8} y={-16} width={4.4} height={16} fill="#2f3640" />
      <Rect x={-11} y={-34} width={3.6} height={15} rx={1.8} fill="#1f9d55" />
      <Rect x={7.4} y={-34} width={3.6} height={15} rx={1.8} fill="#1f9d55" />
      <Rect x={-7} y={-35} width={14} height={20} rx={3} fill="#1f9d55" />
      <Circle cx={0} cy={-41.5} r={6.6} fill="#c68d5e" />
      <Rect x={-6.6} y={-48} width={13.2} height={5} rx={2.5} fill="#2b1d16" />
    </G>
  );
}

const FIGURAS = { pato: Pato, mujer: Mujer, hombre: Hombre } as const;

const EDIFICIOS: [number, number, number, string][] = [
  [40, 90, 90, "#2a2a2a"],
  [150, 62, 70, "#333"],
  [260, 112, 110, "#2a2a2a"],
  [400, 52, 80, "#333"],
  [520, 82, 60, "#2a2a2a"],
  [660, 100, 70, "#333"],
  [760, 122, 90, "#2a2a2a"],
  [880, 67, 120, "#333"],
  [1020, 97, 80, "#2a2a2a"],
  [1110, 57, 90, "#333"],
];

/** Escena completa; `alto` es la altura en pantalla y el ancho se recorta al centro (donde ocurre la acción). */
export default function BusCalle({ alto = 170 }: { alto?: number }) {
  const { width } = useWindowDimensions();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.timing(t, { toValue: 1, duration: CICLO, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [t]);

  const escala = Math.max(width / ANCHO_ESCENA, alto / ALTO_ESCENA);
  const recorteX = (ANCHO_ESCENA * escala - width) / 2;

  const m = useMemo(() => {
    const mundoX = recorrido(-1);
    const giro = recorrido(GRADOS_PX);
    const personas = PERSONAS.map((p) => {
      const e = [0, p.ini, p.fin, 1];
      // balanceo al caminar: oscila solo mientras cruza
      const pasos = Math.max(4, Math.round(((p.fin - p.ini) * 20) / 0.3));
      const be: number[] = [0], bs: number[] = [0];
      for (let i = 0; i <= pasos; i++) {
        be.push(p.ini + ((p.fin - p.ini) * i) / pasos);
        bs.push(i % 2 === 0 ? 4 : -4);
      }
      be.push(p.fin + 0.003, 1);
      bs.push(0, 0);
      return {
        ...p,
        y: { entradas: e, salidas: [Y_ATRAS, Y_ATRAS, Y_FRENTE, Y_FRENTE] },
        s: { entradas: e, salidas: [0.82, 0.82, 1.08, 1.08] },
        paso: { entradas: be, salidas: bs },
      };
    });
    return {
      mundoX,
      giro,
      personas,
      rojo: escalon(0.18, 1, T.rojo, T.verde),
      amarillo: { entradas: [0, T.rojo - 0.0001, T.rojo, 1], salidas: [1, 1, 0.18, 0.18] },
      verde: { entradas: [0, T.verde - 0.0001, T.verde, 1], salidas: [0.18, 0.18, 1, 1] },
      peRojo: { entradas: [0, T.camIni - 0.0001, T.camIni, T.camFin - 0.0001, T.camFin, 1], salidas: [1, 1, 0.18, 0.18, 1, 1] },
      peVerde: escalon(0.18, 1, T.camIni, T.camFin),
    };
  }, []);

  const ip = (r: Rango, f?: (v: number) => number | string) =>
    t.interpolate({ inputRange: r.entradas, outputRange: (f ? r.salidas.map(f) : r.salidas) as string[], extrapolate: "clamp" });

  const mosaicos = [0, 1, 2];

  return (
    <View style={{ height: alto, overflow: "hidden", backgroundColor: C.bg }}>
      <View style={{ position: "absolute", left: -recorteX, bottom: 0, width: ANCHO_ESCENA * escala, height: ALTO_ESCENA * escala, overflow: "hidden" }}>
        {/* mundo: se desplaza hacia atrás mientras el bus (fijo) avanza */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: ANCHO_MUNDO * escala,
            height: ALTO_ESCENA * escala,
            transform: [{ translateX: ip(m.mundoX, (v) => v * escala) as Animated.AnimatedInterpolation<number> }],
          }}
        >
          <Svg width={ANCHO_MUNDO * escala} height={ALTO_ESCENA * escala} viewBox={`0 0 ${ANCHO_MUNDO} ${ALTO_ESCENA}`}>
            {mosaicos.map((k) => (
              <G key={k} transform={`translate(${k * MOSAICO} 0)`}>
                {EDIFICIOS.map(([x, h, w, f], i) => (
                  <Rect key={i} x={x} y={150 - h} width={w} height={h} fill={f} />
                ))}
                <Circle cx={215} cy={140} r={5} fill="#ffd500" opacity={0.5} />
                <Rect x={212} y={112} width={6} height={40} fill="#ffd500" />
                <Rect x={193} y={102} width={44} height={22} rx={6} fill="#ffd500" />
                <SvgText x={215} y={118} fontSize={13} fontWeight="800" fill="#111" textAnchor="middle">BUS</SvgText>
              </G>
            ))}
            <Rect y={150} width={ANCHO_MUNDO} height={22} fill="#2c2c2c" />
            <Rect y={172} width={ANCHO_MUNDO} height={66} fill="#0f0f0f" />
            <Rect y={238} width={ANCHO_MUNDO} height={22} fill="#2c2c2c" />
            {Array.from({ length: 32 }).map((_, i) => (
              <Rect key={i} x={i * PERIODO_LINEA + 10} y={203} width={55} height={5} rx={2.5} fill="#ffd500" />
            ))}
            <G transform={`translate(${X_SEMAFORO} 0)`}>
              {Array.from({ length: 7 }).map((_, i) => (
                <Rect key={i} x={10 + i * 18} y={172} width={11} height={66} rx={1} fill="#f1f1f1" />
              ))}
              <Rect x={-3} y={108} width={6} height={46} fill="#555" />
              <Rect x={-15} y={46} width={30} height={66} rx={9} fill="#111" />
              <Rect x={-7} y={118} width={14} height={24} rx={4} fill="#111" />
            </G>
          </Svg>

          {/* lámparas del semáforo (opacidad animada) */}
          {(
            [
              [62, 8, "#e5484d", m.rojo],
              [80, 8, "#ffd500", m.amarillo],
              [98, 8, "#1f9d55", m.verde],
              [125, 3.6, "#e5484d", m.peRojo],
              [135, 3.6, "#1f9d55", m.peVerde],
            ] as const
          ).map(([cy, r, color, rango]) => (
            <Animated.View
              key={cy}
              style={{
                position: "absolute",
                left: (X_SEMAFORO - r) * escala,
                top: (cy - r) * escala,
                width: 2 * r * escala,
                height: 2 * r * escala,
                borderRadius: r * escala,
                backgroundColor: color,
                opacity: ip(rango) as Animated.AnimatedInterpolation<number>,
              }}
            />
          ))}

        </Animated.View>

        {/* bus: fijo en pantalla */}
        <View style={{ position: "absolute", left: X_BUS * escala, top: 128 * escala, width: 320 * 0.75 * escala, height: 130 * 0.75 * escala }}>
          <Svg width={320 * 0.75 * escala} height={130 * 0.75 * escala} viewBox="0 0 320 130">
            <Rect x={4} y={14} width={312} height={90} rx={22} fill="#ffd500" />
            <Rect x={4} y={72} width={312} height={18} fill="#1f9d55" />
            <Rect x={24} y={26} width={58} height={42} rx={8} fill="#1a2a30" />
            <Rect x={92} y={26} width={58} height={42} rx={8} fill="#1a2a30" />
            <Rect x={160} y={26} width={58} height={42} rx={8} fill="#1a2a30" />
            <Rect x={228} y={26} width={72} height={56} rx={8} fill="#1a2a30" />
            <Rect x={234} y={31} width={60} height={11} rx={4} fill="#fff" />
            <SvgText x={264} y={40} fontSize={9} fontWeight="800" fill="#111" textAnchor="middle">MÓNTESE</SvgText>
            <Circle cx={306} cy={90} r={5} fill="#fff" />
            <Circle cx={70} cy={106} r={19} fill="#111" />
            <Circle cx={70} cy={106} r={9} fill="#ffd500" />
            <Circle cx={248} cy={106} r={19} fill="#111" />
            <Circle cx={248} cy={106} r={9} fill="#ffd500" />
          </Svg>
          {/* radio de cada rueda: gira según lo recorrido */}
          {[70, 248].map((cx) => (
            <Animated.View
              key={cx}
              style={{
                position: "absolute",
                left: cx * 0.75 * escala - 1.5 * 0.75 * escala,
                top: 97 * 0.75 * escala,
                width: 3 * 0.75 * escala,
                height: 18 * 0.75 * escala,
                backgroundColor: "#111",
                transform: [{ rotate: ip(m.giro, (v) => `${v}deg`) as Animated.AnimatedInterpolation<string> }],
              }}
            />
          ))}
        </View>

        {/* peatones: van por encima del bus, en el mismo mundo que se desplaza */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: ANCHO_MUNDO * escala,
            height: ALTO_ESCENA * escala,
            transform: [{ translateX: ip(m.mundoX, (v) => v * escala) as Animated.AnimatedInterpolation<number> }],
          }}
        >
          {/* peatones: esperan atrás, cruzan con la luz peatonal y se quedan quietos adelante */}
          {m.personas.map((p) => {
            const Figura = FIGURAS[p.id];
            return (
              <Animated.View
                key={p.id}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 80 * escala,
                  height: 80 * escala,
                  transform: [
                    { translateX: (X_SEMAFORO + p.x - 40) * escala },
                    { translateY: ip(p.y, (v) => (v - 60) * escala) as Animated.AnimatedInterpolation<number> },
                    { scale: ip(p.s) as Animated.AnimatedInterpolation<number> },
                    { rotate: ip(p.paso, (v) => `${v}deg`) as Animated.AnimatedInterpolation<string> },
                  ],
                }}
              >
                <Svg width={80 * escala} height={80 * escala} viewBox="-40 -60 80 80">
                  <Figura />
                </Svg>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}
