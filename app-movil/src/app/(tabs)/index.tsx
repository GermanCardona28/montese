import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import BusCalle from "@/components/BusCalle";
import { Cartel, LogoMark, Wordmark } from "@/components/Marca";
import Planificador from "@/components/Planificador";
import { Aparece, Boton, Txt } from "@/components/ui";
import { useReinicioPestana } from "@/lib/reinicio";
import { cargarRutasMapa } from "@/lib/rutas";
import { C, F, R } from "@/theme";

function useConteo(objetivo: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!objetivo) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const f = Math.min(1, (Date.now() - t0) / 1400);
      setV(Math.round(objetivo * (1 - Math.pow(1 - f, 3))));
      if (f >= 1) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [objetivo]);
  return v;
}

function Cifras() {
  const [d, setD] = useState({ rutas: 0, empresas: 0, desde: 0, km: 0 });
  useEffect(() => {
    cargarRutasMapa()
      .then((r) =>
        setD({
          rutas: r.length,
          empresas: new Set(r.map((x) => x.companies?.nombre)).size,
          desde: Math.min(...r.map((x) => x.tarifa_cop ?? Infinity)),
          km: Math.round(r.reduce((s, x) => s + (x.longitud_km ?? 0), 0)),
        })
      )
      .catch(() => {});
  }, []);
  const rutas = useConteo(d.rutas), empresas = useConteo(d.empresas), desde = useConteo(d.desde === Infinity ? 0 : d.desde), km = useConteo(d.km);

  const tile = (color: string, ink: string, n: string, txt: string, ancho: "mitad" | "todo", big = false) => (
    <View style={[s.tile, { backgroundColor: color, flexBasis: ancho === "mitad" ? "48.5%" : "100%" }]}>
      <Text style={{ fontFamily: F.xbold, fontSize: big ? 52 : 34, lineHeight: big ? 54 : 36, letterSpacing: -2, color: ink, includeFontPadding: false }}>{n}</Text>
      <Text style={{ fontFamily: F.semi, fontSize: 14, color: ink }}>{txt}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {tile(C.green, "#fff", String(rutas), "rutas con trazado, horarios y tarifa", "todo", true)}
      {tile(C.yellow, C.dark, String(empresas), "empresas de buses", "mitad")}
      {tile(C.blue, "#fff", `$${desde.toLocaleString("es-CO")}`, "pasaje desde", "mitad")}
      {tile(C.greenDark, "#fff", `${km.toLocaleString("es-CO")} km`, "de recorridos mapeados en cuatro municipios", "todo")}
    </View>
  );
}

const PASOS = [
  { t: "Dile a dónde vas.", c: C.yellow, ink: C.dark },
  { t: "Mira cuánto tarda y cuánto cuesta.", c: C.blue, ink: "#fff" },
  { t: "Suba y móntese.", c: C.green, ink: "#fff" },
];

function DibujoPaso({ i }: { i: number }) {
  if (i === 0)
    return (
      <Svg width={76} height={46} viewBox="0 0 240 140">
        <Path d="M24 112C70 112 70 40 120 40s56 72 96 72" fill="none" stroke="#111" strokeWidth={9} strokeLinecap="round" />
        <Circle cx={24} cy={112} r={20} fill="#1f9d55" />
        <SvgText x={24} y={120} fontSize={22} fontWeight="800" fill="#fff" textAnchor="middle">A</SvgText>
        <Circle cx={216} cy={112} r={20} fill="#1e6fd9" />
        <SvgText x={216} y={120} fontSize={22} fontWeight="800" fill="#fff" textAnchor="middle">B</SvgText>
      </Svg>
    );
  if (i === 1) return <Cartel codigo="28" />;
  return <LogoMark size={52} />;
}

export default function Inicio() {
  const { top } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pagina = useRef<ComponentRef<typeof ScrollView>>(null);
  useReinicioPestana("index", () => pagina.current?.scrollTo({ y: 0, animated: true }));
  const tam = Math.min(96, Math.round((width - 40) / 4.6));
  const linea = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(linea, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [linea]);
  const sube = (d: number) => ({
    opacity: linea,
    transform: [{ translateY: linea.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) }],
  });

  return (
    <ScrollView ref={pagina} style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: top + 14, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <Wordmark />
        <View style={{ marginTop: 18 }}>
          <Animated.Text style={[{ fontFamily: F.xbold, fontSize: tam, lineHeight: tam * 0.98, letterSpacing: -tam * 0.045, color: C.ink }, sube(50)]}>Móntese</Animated.Text>
          <Animated.Text style={[{ fontFamily: F.xbold, fontSize: tam, lineHeight: tam * 0.98, letterSpacing: -tam * 0.045, color: C.yellow }, sube(70)]}>en el bus</Animated.Text>
        </View>
        <Aparece delay={500}>
          <Txt style={{ fontSize: 18, lineHeight: 26 }}>Qué bus tomar, cuánto tarda y cuánto cuesta en Bucaramanga, Floridablanca, Girón y Piedecuesta.</Txt>
        </Aparece>
        <Aparece delay={650}>
          <Planificador />
        </Aparece>
      </View>

      <View style={{ marginTop: 28 }}>
        <BusCalle />
      </View>

      <View style={{ paddingHorizontal: 8, gap: 8, marginTop: 8 }}>
        {PASOS.map((p, i) => (
          <View key={p.t} style={[s.paso, { backgroundColor: p.c }]}>
            <View style={{ width: 80, alignItems: "center" }}>
              <DibujoPaso i={i} />
            </View>
            <Text style={{ flex: 1, fontFamily: F.bold, fontSize: 18, letterSpacing: -0.4, color: p.ink }}>{p.t}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 8, marginTop: 24, gap: 12 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 24, letterSpacing: -0.6, color: C.ink, paddingHorizontal: 12 }}>Todo el transporte en un solo lugar.</Text>
        <Cifras />
      </View>

      <View style={[s.cierre]}>
        <Text style={{ fontFamily: F.xbold, fontSize: Math.min(60, tam * 0.75), lineHeight: Math.min(60, tam * 0.75) * 1.18, letterSpacing: -2.4, color: C.dark, paddingBottom: 6 }}>¿Ya sabe{"\n"}cuál coger?</Text>
        <Txt style={{ color: C.dark, fontFamily: F.semi }}>Mire el mapa con todas las rutas o planee su próximo viaje.</Txt>
        <Boton texto="Ver el mapa" variante="oscuro" onPress={() => router.navigate("/mapa")} />
      </View>

      <View style={{ paddingHorizontal: 8, marginTop: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 92 }}>
          {(
            [
              ["M", C.green, 1, "#fff"],
              ["ó", C.blue, 0.72, "#fff"],
              ["n", C.yellow, 0.84, C.dark],
              ["t", C.green, 0.92, "#fff"],
              ["e", C.green, 0.68, "#fff"],
              ["s", C.blue, 0.8, "#fff"],
              ["e", C.yellow, 0.96, C.dark],
            ] as const
          ).map(([l, bg, h, ink], i) => (
            <View key={i} style={{ flex: 1, height: 92 * h, backgroundColor: bg, borderRadius: R / 2, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: F.xbold, fontSize: 36, color: ink }}>{l}</Text>
            </View>
          ))}
        </View>
        <Txt v="suave" style={{ padding: 12 }}>
          Datos de rutas y horarios: Área Metropolitana de Bucaramanga. Los tiempos son estimaciones.
        </Txt>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  paso: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: R, paddingVertical: 14, paddingHorizontal: 12 },
  tile: { borderRadius: R, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16, gap: 8, justifyContent: "flex-start" },
  cierre: { backgroundColor: C.yellow, borderRadius: R, marginHorizontal: 8, marginTop: 8, padding: 22, gap: 14 },
});
