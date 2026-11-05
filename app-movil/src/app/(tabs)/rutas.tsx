import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RutasLista from "@/components/RutasLista";
import { Titulo } from "@/components/ui";
import { C } from "@/theme";

export default function Rutas() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: top + 12 }}>
      <RutasLista pestana="rutas" cabecera={<Titulo texto="Rutas" sub="Todas las rutas de bus del área metropolitana, con su horario, frecuencia y pasaje." />} />
    </View>
  );
}
