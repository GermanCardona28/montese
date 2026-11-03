import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapaRutas from "@/components/MapaRutas";
import { BuscaBus, Cartel } from "@/components/Marca";
import { Aparece, Boton, Esqueleto, Txt } from "@/components/ui";
import { pasajeTotal, planificar, type Paso, type Plan } from "@/lib/geo";
import { factorTrafico, hayGoogle, type Trafico } from "@/lib/google";
import { decodificarLugar } from "@/lib/lugares";
import { cargarIncidentes, cargarRutasMapa, esHoraPico, hhmm, type Incidente, type RutaMapa } from "@/lib/rutas";
import { C, F, R, Rs } from "@/theme";

const hora = (d: Date) => d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
const dist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);
const pesos = (n: number) => `$${n.toLocaleString("es-CO")}`;

function Etiqueta({ texto, color = C.green }: { texto: string; color?: string }) {
  return (
    <View style={{ backgroundColor: color, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Txt style={{ fontFamily: F.bold, fontSize: 12 }}>{texto}</Txt>
    </View>
  );
}

function Resumen({ plan }: { plan: Plan }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      {plan.pasos.map((p, i) =>
        p.tipo === "caminar" ? (
          <View key={i} style={s.caminar}>
            <Txt style={{ fontSize: 15 }}>🚶</Txt>
          </View>
        ) : (
          <Cartel key={i} codigo={p.ruta.codigo} chico />
        )
      )}
    </View>
  );
}

function Pasos({ plan, ahora }: { plan: Plan; ahora: Date }) {
  let reloj = ahora.getTime();
  return (
    <View style={{ marginTop: 16, gap: 18 }}>
      {plan.pasos.map((p, i) => {
        const inicio = reloj;
        if (p.tipo === "caminar") {
          reloj += p.min * 60000;
          const destino = p.hacia === "ruta" ? "hasta donde pasa el bus" : p.hacia === "transbordo" ? "hasta el siguiente bus" : "hasta tu destino";
          return (
            <View key={i} style={s.paso}>
              <View style={s.icono}>
                <Txt style={{ fontSize: 16 }}>🚶</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="fuerte">
                  {p.hacia === "transbordo" ? "Transbordo: camina" : "Camina"} {p.min} min · {dist(p.metros)}
                </Txt>
                <Txt v="suave">{destino}</Txt>
              </View>
            </View>
          );
        }
        reloj += (p.minEspera + p.minViaje) * 60000;
        return (
          <View key={i} style={s.paso}>
            <View style={{ width: 40, alignItems: "center" }}>
              <Cartel codigo={p.ruta.codigo} chico />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Txt v="fuerte">
                Sube a la ruta {p.ruta.codigo} <Txt v="suave">· sales ~ {hora(new Date(inicio + p.minEspera * 60000))}</Txt>
              </Txt>
              <BuscaBus empresa={p.ruta.companies} />
              <Txt v="suave">
                Espera ~{p.minEspera} min{p.frecuencia ? ` (pasa cada ~${p.frecuencia} min)` : ""}. Viaja {p.minViaje} min · {dist(p.metros)} y bájate en el punto marcado en el mapa.
              </Txt>
              {!p.enServicio && p.ruta.schedules[0] && (
                <Txt style={{ color: C.yellow, fontFamily: F.semi, fontSize: 14 }}>Fuera de servicio ahora. Primer bus a las {hhmm(p.ruta.schedules[0].primera_salida)}.</Txt>
              )}
            </View>
          </View>
        );
      })}
      <View style={s.paso}>
        <View style={[s.icono, { backgroundColor: C.blue }]}>
          <Txt style={{ fontFamily: F.xbold }}>B</Txt>
        </View>
        <Txt v="fuerte" style={{ flex: 1 }}>Llegas ~ {hora(new Date(reloj))}</Txt>
      </View>
    </View>
  );
}

export default function Viaje() {
  const { top } = useSafeAreaInsets();
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const a = useMemo(() => decodificarLugar(params.a), [params.a]);
  const b = useMemo(() => decodificarLugar(params.b), [params.b]);
  const [rutas, setRutas] = useState<RutaMapa[] | null>(null);
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [error, setError] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [trafico, setTrafico] = useState<Trafico | null>(null);
  const [ahora] = useState(() => new Date());

  useEffect(() => {
    cargarRutasMapa().then(setRutas).catch(() => setError(true));
    cargarIncidentes().then(setIncidentes).catch(() => {});
  }, []);

  // Con Google: cuánto más lento está el tráfico ahora; escala el tiempo de los buses
  useEffect(() => {
    if (a && b && hayGoogle) factorTrafico(a.pos, b.pos).then(setTrafico).catch(() => {});
  }, [a, b]);

  const planes = useMemo(() => (rutas && a && b ? planificar(rutas, a.pos, b.pos, { ahora, factorTrafico: trafico?.factor }) : null), [rutas, a, b, ahora, trafico]);

  useEffect(() => {
    if (planes?.length) setSel((x) => x ?? planes[0].id);
  }, [planes]);

  const actual = planes?.find((p) => p.id === sel) ?? null;
  const rutasMapa = useMemo(() => {
    const ids = new Set<string>();
    planes?.forEach((p) => p.pasos.forEach((x) => x.tipo === "bus" && ids.add(x.ruta.id)));
    return (rutas ?? []).filter((r) => ids.has(r.id));
  }, [planes, rutas]);

  const pico = esHoraPico(ahora);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ height: "40%" }}>
        <MapaRutas rutas={rutasMapa} selId={null} viaje={actual && a && b ? { a: a.pos, b: b.pos, pasos: actual.pasos } : null} />
        <Pressable onPress={() => router.back()} style={[s.atras, { top: top + 10 }]} accessibilityRole="button" accessibilityLabel="Volver">
          <Txt style={{ fontFamily: F.bold, fontSize: 15 }}>← Cambiar</Txt>
        </Pressable>
      </View>

      <ScrollView style={s.hoja} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}>
        <View>
          <Txt v="suave">A · Sales de</Txt>
          <Txt style={{ fontFamily: F.bold, fontSize: 22, letterSpacing: -0.5 }} numberOfLines={1}>{a?.nombre ?? "…"}</Txt>
          <Txt v="suave" style={{ marginTop: 6 }}>B · Vas a</Txt>
          <Txt style={{ fontFamily: F.bold, fontSize: 22, letterSpacing: -0.5 }} numberOfLines={1}>{b?.nombre ?? "…"}</Txt>
        </View>

        <View style={s.aviso}>
          <Txt v="suave">
            {pico ? "Hora pico: los buses van más lentos." : "Hora valle: la circulación es más fluida."}{" "}
            {incidentes.length ? `Hay ${incidentes.length} reporte${incidentes.length > 1 ? "s" : ""} de trancones o cierres.` : "Sin trancones reportados."}{" "}
            {trafico ? `Tráfico ahora: ${trafico.nivel}.` : "Tiempos estimados; sin tráfico en vivo."}
          </Txt>
        </View>

        {error && <Txt style={{ color: C.red }}>No se pudieron cargar las rutas. Revisa tu conexión.</Txt>}
        {!planes && !error && (
          <>
            <Esqueleto alto={130} />
            <Esqueleto alto={130} />
          </>
        )}

        {planes?.length === 0 && (
          <View style={[s.tarjeta, { backgroundColor: C.surface2 }]}>
            <Txt v="titulo" style={{ fontSize: 22 }}>No encuentro cómo llegar en bus.</Txt>
            <Txt v="suave" style={{ marginTop: 6 }}>Ninguna ruta pasa cerca de uno de los dos puntos. Prueba con un punto sobre una avenida o mira el mapa de rutas.</Txt>
            <Boton texto="Ver el mapa de rutas" variante="gris" chico onPress={() => router.navigate("/mapa")} style={{ marginTop: 12, alignSelf: "flex-start" }} />
          </View>
        )}

        {planes?.map((p, i) => {
          const activa = p.id === sel;
          const llegada = new Date(ahora.getTime() + p.minTotal * 60000);
          const tarifa = pasajeTotal(p);
          const buses = p.pasos.filter((x): x is Extract<Paso, { tipo: "bus" }> => x.tipo === "bus");
          const reportes = incidentes.filter((x) => buses.some((z) => z.ruta.id === x.route_id));
          return (
            <Aparece key={p.id} delay={Math.min(i, 5) * 70}>
              <View style={[s.tarjeta, activa && { backgroundColor: C.surface2, borderColor: C.yellow, borderWidth: 3 }]}>
                <Pressable onPress={() => setSel(p.id)} accessibilityRole="button" accessibilityState={{ selected: activa }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {p.etiquetas.map((e) => <Etiqueta key={e} texto={e} />)}
                        {p.transbordos > 0 && <Etiqueta texto="1 transbordo" color="#ffffff26" />}
                        {!p.enServicio && <Etiqueta texto="Fuera de servicio" color="#ffffff26" />}
                        {reportes.length > 0 && <Etiqueta texto="Reporte activo" color={C.red} />}
                      </View>
                      <Resumen plan={p} />
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Txt style={{ fontFamily: F.xbold, fontSize: 38, letterSpacing: -1.5, lineHeight: 40 }}>{p.minTotal}</Txt>
                      <Txt v="suave">min</Txt>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
                    <Txt>
                      Llegas ~ <Txt v="fuerte">{hora(llegada)}</Txt> · camina {Math.round(p.metrosCaminados / 10) * 10} m
                    </Txt>
                    <Txt v="fuerte">{tarifa != null ? pesos(tarifa) : p.id === "caminar" ? "Gratis" : "—"}</Txt>
                  </View>
                </Pressable>
                {activa && <Pasos plan={p} ahora={ahora} />}
              </View>
            </Aparece>
          );
        })}

        {planes && planes.length > 0 && <Txt v="suave">Buses del AMB. Los colores indican la flota; si no coincide, confirma el número de ruta en el letrero.</Txt>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hoja: { flex: 1, backgroundColor: C.bg, marginTop: -R, borderTopLeftRadius: R, borderTopRightRadius: R },
  atras: { position: "absolute", left: 12, backgroundColor: C.dark, borderRadius: R, paddingHorizontal: 16, paddingVertical: 10 },
  aviso: { backgroundColor: C.surface, borderRadius: R, padding: 16 },
  tarjeta: { backgroundColor: C.surface, borderRadius: R, padding: 18 },
  caminar: { height: 32, minWidth: 32, borderRadius: 16, backgroundColor: "#ffffff26", alignItems: "center", justifyContent: "center" },
  paso: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  icono: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff26", alignItems: "center", justifyContent: "center" },
});
