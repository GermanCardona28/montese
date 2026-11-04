import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type LatLng } from "react-native-maps";
import { LogoMark } from "@/components/Marca";
import { Txt } from "@/components/ui";
import { lineaDe, prepararLinea, type LngLat, type Paso } from "@/lib/geo";
import { colorRuta, type RutaMapa } from "@/lib/rutas";
import { C, F } from "@/theme";

export type ViajeMapa = { a: LngLat; b: LngLat; pasos: Paso[] };

type Props = {
  rutas: RutaMapa[];
  selId: string | null;
  onSelect?: (id: string | null) => void;
  viaje?: ViajeMapa | null;
  trafico?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ll = (p: LngLat): LatLng => ({ latitude: p[1], longitude: p[0] });
const INICIO = { latitude: 7.1, longitude: -73.1, latitudeDelta: 0.35, longitudeDelta: 0.35 };

/** Mapa de rutas: líneas por empresa, toque para ver una ruta completa, viaje A→B y un bus que recorre el trazado. */
export default function MapaRutas({ rutas, selId, onSelect, viaje, trafico, style }: Props) {
  const mapa = useRef<MapView>(null);
  const [bus, setBus] = useState<LatLng | null>(null);
  const [fijarMarcadores, setFijarMarcadores] = useState(false);

  const lineas = useMemo(() => new Map(rutas.map((r) => [r.id, lineaDe(r).coords.map(ll)])), [rutas]);
  const sel = rutas.find((r) => r.id === selId) ?? null;

  // Recorrido que anima el bus: el tramo de bus del viaje, o la ruta elegida entera
  const recorrido = useMemo<LngLat[] | null>(() => {
    if (viaje) return viaje.pasos.flatMap((p) => (p.tipo === "bus" ? p.tramo : []));
    if (sel) return lineaDe(sel).coords;
    return null;
  }, [viaje, sel]);

  // Encuadre
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    let pts: LatLng[] = [];
    if (viaje) pts = [viaje.a, viaje.b, ...viaje.pasos.flatMap((p) => (p.tipo === "bus" ? p.tramo : []))].map(ll);
    else if (sel) pts = lineas.get(sel.id) ?? [];
    else if (rutas.length) {
      const todos = [...lineas.values()].flat();
      const lat = todos.map((p) => p.latitude), lng = todos.map((p) => p.longitude);
      pts = [
        { latitude: Math.min(...lat), longitude: Math.min(...lng) },
        { latitude: Math.max(...lat), longitude: Math.max(...lng) },
      ];
    }
    if (pts.length > 1) {
      const t = setTimeout(() => m.fitToCoordinates(pts, { edgePadding: { top: 80, right: 50, bottom: 80, left: 50 }, animated: true }), 250);
      return () => clearTimeout(t);
    }
  }, [viaje, sel, rutas, lineas]);

  // Bus que recorre el trazado en bucle
  useEffect(() => {
    if (!recorrido || recorrido.length < 2) {
      setBus(null);
      return;
    }
    const linea = prepararLinea(recorrido);
    const duracion = Math.min(16000, Math.max(7000, linea.total / 2.2));
    const t0 = Date.now();
    const id = setInterval(() => {
      const s = (((Date.now() - t0) % duracion) / duracion) * linea.total;
      let i = 0;
      while (i < linea.cum.length - 2 && linea.cum[i + 1] < s) i++;
      const seg = linea.cum[i + 1] - linea.cum[i] || 1;
      const u = Math.max(0, Math.min(1, (s - linea.cum[i]) / seg));
      setBus({
        longitude: linea.coords[i][0] + u * (linea.coords[i + 1][0] - linea.coords[i][0]),
        latitude: linea.coords[i][1] + u * (linea.coords[i + 1][1] - linea.coords[i][1]),
      });
    }, 70);
    return () => clearInterval(id);
  }, [recorrido]);

  // Los marcadores con vista propia necesitan seguirla un instante para dibujarse; luego se congelan (rinde mejor)
  useEffect(() => {
    setFijarMarcadores(false);
    const t = setTimeout(() => setFijarMarcadores(true), 1200);
    return () => clearTimeout(t);
  }, [viaje]);

  const buses = viaje?.pasos.filter((p): p is Extract<Paso, { tipo: "bus" }> => p.tipo === "bus") ?? [];
  const atenuar = !!selId || !!viaje;

  return (
    <MapView
      ref={mapa}
      style={[StyleSheet.absoluteFill, style]}
      provider={PROVIDER_GOOGLE}
      initialRegion={INICIO}
      showsTraffic={!!trafico}
      showsUserLocation
      toolbarEnabled={false}
      onPress={() => onSelect?.(null)}
    >
      {rutas.map((r) => {
        const activa = selId === r.id;
        const color = colorRuta(r);
        return (
          <Polyline
            key={r.id}
            coordinates={lineas.get(r.id) ?? []}
            strokeColor={atenuar && !activa ? `${color}33` : color}
            strokeWidth={activa ? 8 : 4}
            lineCap="round"
            lineJoin="round"
            tappable
            zIndex={activa ? 5 : 1}
            onPress={() => onSelect?.(r.id)}
          />
        );
      })}

      {viaje?.pasos.map((p, i) =>
        p.tipo === "caminar" ? (
          <Polyline key={`w${i}`} coordinates={[ll(p.desde), ll(p.hasta)]} strokeColor={C.dark} strokeWidth={4} lineDashPattern={[10, 10]} zIndex={6} />
        ) : (
          <Polyline key={`b${i}`} coordinates={p.tramo.map(ll)} strokeColor={colorRuta(p.ruta)} strokeWidth={8} lineCap="round" lineJoin="round" zIndex={7} />
        )
      )}

      {viaje && (
        <>
          <Marker coordinate={ll(viaje.a)} tracksViewChanges={!fijarMarcadores}>
            <View style={[s.punto, { backgroundColor: C.green }]}>
              <Txt style={s.puntoTxt}>A</Txt>
            </View>
          </Marker>
          <Marker coordinate={ll(viaje.b)} tracksViewChanges={!fijarMarcadores}>
            <View style={[s.punto, { backgroundColor: C.blue }]}>
              <Txt style={s.puntoTxt}>B</Txt>
            </View>
          </Marker>
          {buses.map((p, i) => (
            <Marker key={`s${i}`} coordinate={ll(p.subida)} tracksViewChanges={!fijarMarcadores}>
              <View style={s.cartel}>
                <Txt style={[s.puntoTxt, { fontSize: 14 }]}>{p.ruta.codigo}</Txt>
              </View>
            </Marker>
          ))}
        </>
      )}

      {bus && (
        <MarcadorBus pos={bus} />
      )}
    </MapView>
  );
}

function MarcadorBus({ pos }: { pos: LatLng }) {
  const [sigue, setSigue] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSigue(false), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <Marker coordinate={pos} anchor={{ x: 0.5, y: 0.5 }} zIndex={20} tracksViewChanges={sigue}>
      <LogoMark size={46} sinPlaca />
    </Marker>
  );
}

const s = StyleSheet.create({
  punto: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  puntoTxt: { color: "#fff", fontFamily: F.xbold, fontSize: 16 },
  cartel: { backgroundColor: C.dark, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2, borderColor: "#fff" },
});
