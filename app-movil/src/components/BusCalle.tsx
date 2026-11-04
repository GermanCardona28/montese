import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { C } from "@/theme";

/**
 * Escena animada (ciclo de 18 s): el bus avanza, frena en el semáforo cuando pasa a rojo,
 * y mientras espera cruzan la cebra un pato, una mujer y un hombre. Cuando vuelve el verde, el bus arranca.
 * Un solo reloj (0→1) mueve todo, así las piezas siempre quedan sincronizadas.
 */

const CICLO = 18000;
const ALTO_ESCENA = 260; // unidades de la escena (ancho 1200)
const ANCHO_ESCENA = 1200;
const T = { frena: 0.3, arranca: 0.72, amarillo: 0.28, rojo: 0.33 };
const X_PARADA = 335;
const X_FUERA = 1260;
const Y_ATRAS = 168;
const Y_FRENTE = 252;

/** Aproxima una curva de aceleración con tramos lineales para usar un solo reloj. */
function curva(desde: number, hasta: number, t0: number, t1: number, f: (u: number) => number, n = 8) {
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

function unir(...c: { entradas: number[]; salidas: number[] }[]) {
  const entradas: number[] = [], salidas: number[] = [];
  c.forEach((x, i) => {
    x.entradas.forEach((e, j) => {
      if (i > 0 && j === 0 && e === entradas[entradas.length - 1]) return;
      entradas.push(e);
      salidas.push(x.salidas[j]);
    });
  });
  return { entradas, salidas };
}

type Rango = { entradas: number[]; salidas: number[] };
const rango = (r: Rango, t: Animated.Value) => t.interpolate({ inputRange: r.entradas, outputRange: r.salidas, extrapolate: "clamp" });

const PERSONAS = [
  { id: "pato", x: 632, ini: 0.38, fin: 0.56 },
  { id: "mujer", x: 668, ini: 0.4, fin: 0.62 },
  { id: "hombre", x: 704, ini: 0.44, fin: 0.66 },
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
  const recorteX = (ANCHO_ESCENA * escala - width) / 2; // se muestra la parte central de la escena

  const m = useMemo(() => {
    const busX = unir(
      curva(-260, X_PARADA, 0, T.frena, frenar),
      { entradas: [T.frena, T.arranca], salidas: [X_PARADA, X_PARADA] },
      curva(X_PARADA, 1260, T.arranca, 1, arrancar)
    );
    const rojo = { entradas: [0, T.rojo - 0.0001, T.rojo, T.arranca, T.arranca + 0.0001, 1], salidas: [0.18, 0.18, 1, 1, 0.18, 0.18] };
    const amarillo = { entradas: [0, T.amarillo - 0.0001, T.amarillo, T.rojo - 0.0001, T.rojo, 1], salidas: [0.18, 0.18, 1, 1, 0.18, 0.18] };
    const verde = { entradas: [0, T.amarillo - 0.0001, T.amarillo, T.arranca, T.arranca + 0.0001, 1], salidas: [1, 1, 0.18, 0.18, 1, 1] };
    const giro = unir(curva(0, 1000, 0, T.frena, frenar), { entradas: [T.frena, T.arranca], salidas: [1000, 1000] }, curva(1000, 2800, T.arranca, 1, arrancar));
    // Peatones siempre visibles: entran por la izquierda (acera de atrás), cruzan y salen por la derecha (acera de adelante).
    const personas = PERSONAS.map((p) => {
      const e = [0, p.ini, p.fin, 0.97, 0.9701, 1];
      return {
        ...p,
        x: { entradas: e, salidas: [-60, p.x, p.x, X_FUERA, -60, -60] },
        y: { entradas: e, salidas: [Y_ATRAS, Y_ATRAS, Y_FRENTE, Y_FRENTE, Y_ATRAS, Y_ATRAS] },
        s: { entradas: e, salidas: [0.82, 0.82, 1.08, 1.08, 0.82, 0.82] },
      };
    });
    return { busX, rojo, amarillo, verde, giro, personas };
  }, []);

  // balanceo al caminar: oscila siempre, con su propio reloj corto
  const paso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(paso, { toValue: 1, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(paso, { toValue: 0, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [paso]);
  const balanceo = paso.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "4deg"] });

  return (
    <View style={{ height: alto, overflow: "hidden", backgroundColor: C.bg }}>
      <View style={{ position: "absolute", left: -recorteX, bottom: 0, width: ANCHO_ESCENA * escala, height: ALTO_ESCENA * escala }}>
        {/* fondo fijo */}
        <Svg width={ANCHO_ESCENA * escala} height={ALTO_ESCENA * escala} viewBox={`0 0 ${ANCHO_ESCENA} ${ALTO_ESCENA}`}>
          {(
            [
              [40, 90, 90, "#2a2a2a"],
              [150, 62, 70, "#333"],
              [260, 112, 110, "#2a2a2a"],
              [400, 52, 80, "#333"],
              [520, 82, 60, "#2a2a2a"],
              [760, 122, 90, "#333"],
              [880, 67, 120, "#2a2a2a"],
              [1020, 97, 80, "#333"],
              [1110, 57, 90, "#2a2a2a"],
            ] as const
          ).map(([x, h, w, f], i) => (
            <Rect key={i} x={x} y={150 - h} width={w} height={h} fill={f} />
          ))}
          <Rect y={150} width={1200} height={22} fill="#2c2c2c" />
          <Rect y={172} width={1200} height={66} fill="#0f0f0f" />
          <Rect y={238} width={1200} height={22} fill="#2c2c2c" />
          {Array.from({ length: 13 }).map((_, i) => (
            <Rect key={i} x={i * 96 + 10} y={203} width={48} height={5} rx={2.5} fill="#ffd500" />
          ))}
          <Circle cx={215} cy={140} r={9} fill="#ffd500" />
          <Rect x={212} y={112} width={6} height={40} fill="#ffd500" />
          <Rect x={193} y={102} width={44} height={22} rx={6} fill="#ffd500" />
          <SvgText x={215} y={118} fontSize={13} fontWeight="800" fill="#111" textAnchor="middle">BUS</SvgText>
          {Array.from({ length: 7 }).map((_, i) => (
            <Rect key={i} x={598 + i * 18} y={172} width={11} height={66} rx={1} fill="#f1f1f1" />
          ))}
          <Rect x={586} y={108} width={6} height={46} fill="#555" />
          <Rect x={574} y={46} width={30} height={66} rx={9} fill="#111" />
        </Svg>

        {/* lámparas del semáforo (opacidad animada) */}
        {(
          [
            [62, "#e5484d", m.rojo],
            [80, "#ffd500", m.amarillo],
            [98, "#1f9d55", m.verde],
          ] as const
        ).map(([cy, color, r]) => (
          <Animated.View
            key={cy}
            style={{
              position: "absolute",
              left: (589 - 8) * escala,
              top: (cy - 8) * escala,
              width: 16 * escala,
              height: 16 * escala,
              borderRadius: 8 * escala,
              backgroundColor: color,
              opacity: rango(r, t),
            }}
          />
        ))}

        {/* bus */}
        <Animated.View
          style={{
            position: "absolute",
            top: 128 * escala,
            width: 320 * 0.75 * escala,
            height: 130 * 0.75 * escala,
            transform: [{ translateX: t.interpolate({ inputRange: m.busX.entradas, outputRange: m.busX.salidas.map((v) => v * escala) }) }],
          }}
        >
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
          {/* radios de las ruedas: giran con el mismo reloj, se detienen cuando el bus frena */}
          {[70, 248].map((cx) => (
            <Animated.View
              key={cx}
              style={{
                position: "absolute",
                left: (cx / 320) * 320 * 0.75 * escala - 1.5 * 0.75 * escala,
                top: ((106 - 9) / 130) * 130 * 0.75 * escala,
                width: 3 * 0.75 * escala,
                height: 18 * 0.75 * escala,
                backgroundColor: "#111",
                transform: [{ rotate: t.interpolate({ inputRange: m.giro.entradas, outputRange: m.giro.salidas.map((v) => `${v}deg`) }) }],
              }}
            />
          ))}
        </Animated.View>

        {/* peatones: se dibujan en su propio lienzo y se mueven con el reloj */}
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
                  { translateX: t.interpolate({ inputRange: p.x.entradas, outputRange: p.x.salidas.map((v) => (v - 40) * escala) }) },
                  { translateY: t.interpolate({ inputRange: p.y.entradas, outputRange: p.y.salidas.map((v) => (v - 60) * escala) }) },
                  { scale: rango(p.s, t) },
                  { rotate: balanceo },
                ],
              }}
            >
              <Svg width={80 * escala} height={80 * escala} viewBox="-40 -60 80 80">
                <Figura />
              </Svg>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
