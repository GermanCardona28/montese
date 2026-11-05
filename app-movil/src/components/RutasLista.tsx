import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Aparece, Boton, Esqueleto, Txt } from "@/components/ui";
import { BuscaBus, BusColor, Cartel } from "@/components/Marca";
import { useReinicioPestana } from "@/lib/reinicio";
import { cargarRutasLista, esHoraPico, estadoAhora, flotaDe, hhmm, type Ruta } from "@/lib/rutas";
import { C, F, R, Rs } from "@/theme";

/** Lista de rutas con búsqueda y detalle desplegable. `cabecera` va arriba, dentro del mismo scroll. */
export default function RutasLista({ empresa, cabecera, pestana }: { empresa?: string; cabecera?: ReactElement; pestana?: string }) {
  const [rutas, setRutas] = useState<Ruta[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);
  const lista = useRef<FlatList<Ruta>>(null);
  // Doble toque en la pestaña: cierra el detalle, limpia la búsqueda y sube al principio
  useReinicioPestana(pestana ?? "-", () => {
    if (!pestana) return;
    setQ("");
    setAbierta(null);
    lista.current?.scrollToOffset({ offset: 0, animated: true });
  });

  useEffect(() => {
    cargarRutasLista().then(setRutas).catch(() => setError(true));
  }, []);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rutas ?? []).filter((r) => (!empresa || r.companies?.nombre === empresa) && (!t || `${r.codigo} ${r.nombre} ${r.companies?.nombre}`.toLowerCase().includes(t)));
  }, [rutas, q, empresa]);

  const encabezado = (
    <View style={{ gap: 12, marginBottom: 8 }}>
      {cabecera}
      <TextInput style={s.campo} value={q} onChangeText={setQ} placeholder="Barrio, número o empresa" placeholderTextColor="#6b6b6b" accessibilityLabel="Buscar ruta" />
      <Txt v="suave">
        {filtradas.length} rutas · {esHoraPico() ? "ahora es hora pico" : "ahora es hora valle"}
      </Txt>
    </View>
  );

  if (error)
    return (
      <View style={{ padding: 20 }}>
        <Txt style={{ color: C.red }}>No se pudieron cargar las rutas. Revisa tu conexión.</Txt>
      </View>
    );

  if (!rutas)
    return (
      <View style={{ padding: 20, gap: 12 }}>
        {cabecera}
        <Esqueleto alto={56} />
        <Esqueleto alto={110} />
        <Esqueleto alto={110} />
      </View>
    );

  return (
    <FlatList
      ref={lista}
      data={filtradas}
      keyExtractor={(r) => r.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={encabezado}
      contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 8 }}
      initialNumToRender={10}
      renderItem={({ item: r, index }) => {
        const e = estadoAhora(r);
        const s0 = r.schedules[0];
        const abre = abierta === r.id;
        const conTrazado = !!r.trazado_fuente;
        return (
          <Aparece delay={Math.min(index, 6) * 50}>
            <View style={[s.tarjeta, abre && { backgroundColor: C.surface2 }]}>
              <Pressable onPress={() => setAbierta(abre ? null : r.id)} style={s.cabeza} accessibilityRole="button" accessibilityState={{ expanded: abre }}>
                <Cartel codigo={r.codigo} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt v="fuerte" style={{ lineHeight: 21 }}>
                    {r.nombre}
                  </Txt>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <BusColor empresa={flotaDe(r)} ancho={34} />
                    <Txt v="suave" numberOfLines={1} style={{ flex: 1 }}>
                      {r.companies?.nombre}
                    </Txt>
                  </View>
                  {!s0 ? (
                    <Txt v="suave" style={{ fontFamily: F.bold, fontSize: 13 }}>Horario aún no publicado</Txt>
                  ) : (
                    <Txt style={{ color: e.operando ? "#4ade80" : C.muted, fontFamily: F.bold, fontSize: 13 }}>
                      {e.operando ? `● En servicio${e.frecuencia ? ` · cada ~${e.frecuencia} min` : ""}` : "Fuera de servicio"}
                    </Txt>
                  )}
                </View>
              </Pressable>

              {abre && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
                  <BuscaBus empresa={flotaDe(r)} />
                  {s0 && (
                    <View style={s.datos}>
                      <Dato k="Primer despacho" v={hhmm(s0.primera_salida)} />
                      <Dato k="Último despacho" v={hhmm(s0.ultima_salida)} />
                      <Dato k="Frecuencia pico" v={`${s0.frecuencia_pico_min} min`} />
                      <Dato k="Frecuencia valle" v={`${s0.frecuencia_valle_min} min`} />
                      {!!r.terminal && <Dato k="Terminal" v={r.terminal} />}
                    </View>
                  )}
                  {!!r.tarifa_cop && (
                    <View style={[s.datos, { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }]}>
                      <Txt v="suave">Pasaje</Txt>
                      <Txt v="titulo" style={{ fontSize: 24 }}>{`$${r.tarifa_cop.toLocaleString("es-CO")}`}</Txt>
                    </View>
                  )}
                  {!!r.resumen && <Txt style={{ fontSize: 16, lineHeight: 24 }}>{r.resumen}</Txt>}
                  {conTrazado && <Boton texto="Ver su recorrido en el mapa" onPress={() => router.navigate({ pathname: "/mapa", params: { ruta: r.id } })} />}
                </View>
              )}
            </View>
          </Aparece>
        );
      }}
    />
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Txt v="suave">{k}</Txt>
      <Txt v="fuerte" style={{ fontSize: 15, flexShrink: 1, textAlign: "right" }}>
        {v}
      </Txt>
    </View>
  );
}

const s = StyleSheet.create({
  campo: { minHeight: 56, borderRadius: R, backgroundColor: "#fff", paddingHorizontal: 20, fontFamily: F.med, fontSize: 17, color: C.dark },
  tarjeta: { backgroundColor: C.surface, borderRadius: R, overflow: "hidden" },
  cabeza: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16 },
  datos: { backgroundColor: C.bg, borderRadius: Rs, padding: 14, gap: 8 },
});
