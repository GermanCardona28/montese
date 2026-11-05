import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RutasLista from "@/components/RutasLista";
import { BusColor, textoFlota } from "@/components/Marca";
import { Aparece, Boton, Esqueleto, Titulo, Txt } from "@/components/ui";
import { cargarEmpresas, type EmpresaResumen } from "@/lib/rutas";
import { useReinicioPestana } from "@/lib/reinicio";
import { C, F, R } from "@/theme";

export default function Empresas() {
  const { top } = useSafeAreaInsets();
  const [empresas, setEmpresas] = useState<EmpresaResumen[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const lista = useRef<ComponentRef<typeof ScrollView>>(null);
  useReinicioPestana("empresas", () => {
    setSel(null);
    lista.current?.scrollTo({ y: 0, animated: true });
  });

  useEffect(() => {
    cargarEmpresas().then(setEmpresas).catch(() => setEmpresas([]));
  }, []);

  if (sel)
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: top + 12 }}>
        <RutasLista
          empresa={sel}
          cabecera={
            <View style={{ gap: 12 }}>
              <Boton texto="← Empresas" variante="gris" chico onPress={() => setSel(null)} style={{ alignSelf: "flex-start" }} />
              <Txt v="titulo" style={{ fontSize: 28 }}>{sel}</Txt>
            </View>
          }
        />
      </View>
    );

  const conRutas = (empresas ?? []).filter((e) => (e.routes[0]?.count ?? 0) > 0);
  const sinRutas = (empresas ?? []).filter((e) => !(e.routes[0]?.count ?? 0));

  return (
    <ScrollView ref={lista} style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: top + 24, paddingBottom: 32, gap: 10 }}>
      <Titulo texto="Empresas" sub="Quién opera cada ruta y de qué color son sus buses." />
      <View style={{ height: 10 }} />
      {!empresas && (
        <>
          <Esqueleto alto={96} />
          <Esqueleto alto={96} />
          <Esqueleto alto={96} />
        </>
      )}
      {conRutas.map((e, i) => (
        <Aparece key={e.id} delay={Math.min(i, 6) * 60}>
          <Pressable onPress={() => setSel(e.nombre)} style={({ pressed }) => [s.tarjeta, pressed && { backgroundColor: C.surface2 }]} accessibilityRole="button">
            <BusColor empresa={e} ancho={88} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt style={{ fontFamily: F.bold, fontSize: 18, letterSpacing: -0.3 }}>{e.nombre}</Txt>
              <Txt v="suave">
                {e.routes[0]?.count} rutas · {textoFlota(e)}
              </Txt>
            </View>
          </Pressable>
        </Aparece>
      ))}
      {sinRutas.map((e) => (
        <View key={e.id} style={[s.tarjeta, { flexDirection: "column", alignItems: "flex-start", gap: 6 }]}>
          <Txt style={{ fontFamily: F.bold, fontSize: 18 }}>{e.nombre}</Txt>
          <Txt v="suave">
            {e.tipo === "masivo"
              ? "Sin rutas verificadas: el sistema está en reestructuración y no hay un listado oficial vigente."
              : "Rutas intermunicipales por verificar: aún no hay horarios ni trazados confirmados."}
          </Txt>
        </View>
      ))}
      <Txt v="suave" style={{ marginTop: 6 }}>
        Los colores salen de fotos publicadas de cada flota; las marcadas “por confirmar” pueden variar.
      </Txt>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  tarjeta: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.surface, borderRadius: R, padding: 16 },
});
