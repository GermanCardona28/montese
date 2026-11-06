import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapaRutas from "@/components/MapaRutas";
import { BuscaBus, Cartel } from "@/components/Marca";
import { Aparece, Boton, Esqueleto, Txt } from "@/components/ui";
import { useReinicioPestana } from "@/lib/reinicio";
import { cargarRutasMapa, flotaDe, hhmm, type RutaMapa } from "@/lib/rutas";
import { C, F, R, Rs } from "@/theme";

export default function Mapa() {
  const { top } = useSafeAreaInsets();
  const { ruta } = useLocalSearchParams<{ ruta?: string }>();
  const [rutas, setRutas] = useState<RutaMapa[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [trafico, setTrafico] = useState(false);
  const [error, setError] = useState(false);
  useReinicioPestana("mapa", () => {
    setSel(null);
    setTrafico(false);
  });

  useEffect(() => {
    cargarRutasMapa().then(setRutas).catch(() => setError(true));
  }, []);

  // Llega desde la lista de rutas con ?ruta=<id>
  useEffect(() => {
    if (ruta && rutas?.some((r) => r.id === ruta)) setSel(ruta);
  }, [ruta, rutas]);

  const elegida = rutas?.find((r) => r.id === sel);
  const h = elegida?.schedules[0];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1 }}>
        {rutas ? <MapaRutas rutas={rutas} selId={sel} onSelect={setSel} trafico={trafico} /> : !error && <Esqueleto alto={600} style={{ borderRadius: 0 }} />}
        {error && <Txt style={{ color: C.red, padding: 24 }}>No se pudo cargar el mapa. Revisa tu conexión.</Txt>}
        {/* Franja oscura para que la hora y los iconos del celular se lean sobre el mapa */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: top, backgroundColor: C.bg }} />

        <View style={[s.barra, { top: top + 10 }]} pointerEvents="box-none">
          <Pressable onPress={() => setTrafico((t) => !t)} style={[s.btnTrafico, trafico && { backgroundColor: C.yellow }]} accessibilityRole="button" accessibilityState={{ selected: trafico }}>
            <Txt style={{ fontFamily: F.bold, fontSize: 14, color: trafico ? C.dark : C.ink }}>Tráfico en vivo</Txt>
          </Pressable>
          {rutas && !sel && (
            <Aparece delay={600}>
              <View style={s.pista}>
                <Txt style={{ fontFamily: F.semi, fontSize: 14, textAlign: "center" }}>Toca una ruta para ver su recorrido completo</Txt>
              </View>
            </Aparece>
          )}
        </View>
      </View>

      <View style={s.hoja}>
        {elegida ? (
          <Aparece>
            <View style={s.ficha}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <Cartel codigo={elegida.codigo} />
                <View style={{ flex: 1 }}>
                  <Txt v="fuerte" style={{ lineHeight: 21 }}>{elegida.nombre}</Txt>
                  <Txt v="suave" numberOfLines={1}>{elegida.companies?.nombre}</Txt>
                </View>
                <Boton texto="Todas" variante="gris" chico onPress={() => setSel(null)} />
              </View>
              <BuscaBus empresa={flotaDe(elegida)} />
              <View style={{ gap: 4 }}>
                {!!elegida.tarifa_cop && <Fila k="Pasaje" v={`$${elegida.tarifa_cop.toLocaleString("es-CO")}`} />}
                {h && <Fila k="Horario" v={`${hhmm(h.primera_salida)} – ${hhmm(h.ultima_salida)}`} />}
                {h && <Fila k="Cada" v={`${Math.min(h.frecuencia_pico_min ?? 0, h.frecuencia_valle_min ?? 0)}–${Math.max(h.frecuencia_pico_min ?? 0, h.frecuencia_valle_min ?? 0)} min`} />}
                {!!elegida.longitud_km && <Fila k="Recorrido" v={`${elegida.longitud_km} km`} />}
              </View>
            </View>
          </Aparece>
        ) : (
          <Txt v="titulo" style={{ fontSize: 22, marginBottom: 8 }}>Todas las rutas</Txt>
        )}
        <FlatList
          horizontal
          data={rutas ?? []}
          keyExtractor={(r) => r.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSel(sel === item.id ? null : item.id)} style={{ opacity: sel && sel !== item.id ? 0.35 : 1 }} accessibilityRole="button" accessibilityState={{ selected: sel === item.id }}>
              <Cartel codigo={item.codigo} chico />
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Txt v="suave">{k}</Txt>
      <Txt v="fuerte" style={{ fontSize: 15 }}>{v}</Txt>
    </View>
  );
}

const s = StyleSheet.create({
  barra: { position: "absolute", left: 12, right: 12, gap: 8, alignItems: "flex-start" },
  btnTrafico: { backgroundColor: C.dark, borderRadius: R, paddingHorizontal: 16, paddingVertical: 10 },
  pista: { backgroundColor: C.dark, borderRadius: R, paddingHorizontal: 16, paddingVertical: 10 },
  hoja: { backgroundColor: C.bg, borderTopLeftRadius: R, borderTopRightRadius: R, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  ficha: { backgroundColor: C.surface, borderRadius: R, padding: 14, gap: 10, marginBottom: 10 },
});
