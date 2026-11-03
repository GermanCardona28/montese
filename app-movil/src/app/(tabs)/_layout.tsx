import type { ColorValue } from "react-native";
import { Tabs } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { C, F } from "@/theme";

const ICONOS: Record<string, string> = {
  index: "M12 3 3 10v10h6v-6h6v6h6V10z",
  rutas: "M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z",
  mapa: "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  empresas:
    "M4 16c0 .9.4 1.7 1 2.2V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.8c.6-.5 1-1.3 1-2.2V6c0-3.5-3.6-4-8-4S4 2.5 4 6v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18 11H6V6h12v5z",
  alertas:
    "M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.1-1.6-5.6-4.5-6.3V4a1.5 1.5 0 0 0-3 0v.7C7.6 5.4 6 7.9 6 11v5l-2 2v1h16v-1l-2-2z",
};

const icono = (nombre: string) =>
  function Icono({ color }: { color: ColorValue }) {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path d={ICONOS[nombre]} fill={color} />
      </Svg>
    );
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.yellow,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.surface, borderTopWidth: 0, height: 66, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontFamily: F.bold, fontSize: 11 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: icono("index") }} />
      <Tabs.Screen name="rutas" options={{ title: "Rutas", tabBarIcon: icono("rutas") }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa", tabBarIcon: icono("mapa") }} />
      <Tabs.Screen name="empresas" options={{ title: "Empresas", tabBarIcon: icono("empresas") }} />
      <Tabs.Screen name="alertas" options={{ title: "Alertas", tabBarIcon: icono("alertas") }} />
    </Tabs>
  );
}
