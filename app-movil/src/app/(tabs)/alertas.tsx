import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BusCalle from "@/components/BusCalle";
import { Aparece, Esqueleto, Panel, Titulo, Txt } from "@/components/ui";
import { cargarIncidentes, type Incidente } from "@/lib/rutas";
import { C, F } from "@/theme";

const TIPOS: Record<string, string> = { trancon: "Trancón", retraso: "Retraso", cierre_via: "Cierre de vía", accidente: "Accidente", otro: "Aviso" };

export default function Alertas() {
  const { top } = useSafeAreaInsets();
  const [lista, setLista] = useState<Incidente[] | null>(null);

  useEffect(() => {
    cargarIncidentes().then(setLista).catch(() => setLista([]));
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: top + 24, paddingBottom: 24 }}>
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        <Titulo texto="Alertas" sub="Trancones, retrasos y cierres reportados por la comunidad." />
        <View style={{ height: 8 }} />
        {lista === null && <Esqueleto alto={96} />}
        {lista?.length === 0 && (
          <Aparece delay={400}>
            <Panel color={C.greenDark}>
              <Txt style={{ fontFamily: F.xbold, fontSize: 30, letterSpacing: -1 }}>Vía libre.</Txt>
              <Txt style={{ marginTop: 6 }}>No hay reportes activos ahora mismo.</Txt>
            </Panel>
          </Aparece>
        )}
        {lista?.map((a, i) => (
          <Aparece key={i} delay={i * 60}>
            <Panel color={C.red}>
              <Txt v="titulo">{TIPOS[a.tipo] ?? "Aviso"}</Txt>
              {!!a.descripcion && <Txt style={{ marginTop: 4 }}>{a.descripcion}</Txt>}
            </Panel>
          </Aparece>
        ))}
        <Panel>
          <Txt v="titulo" style={{ fontSize: 20 }}>Pronto podrás reportar.</Txt>
          <Txt v="suave" style={{ marginTop: 4 }}>
            Cuando termines tu viaje podrás avisar de un trancón o un retraso para ayudar a los demás.
          </Txt>
        </Panel>
      </View>
      <View style={{ marginTop: 32 }}>
        <BusCalle alto={160} />
      </View>
    </ScrollView>
  );
}
