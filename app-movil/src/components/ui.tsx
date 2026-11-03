import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { C, F, R } from "@/theme";

type Variante = "display" | "titulo" | "cuerpo" | "fuerte" | "suave" | "chico";

const TEXTO: Record<Variante, TextStyle> = {
  display: { fontFamily: F.xbold, color: C.ink, letterSpacing: -2, lineHeight: undefined },
  titulo: { fontFamily: F.bold, color: C.ink, letterSpacing: -0.5, fontSize: 24 },
  cuerpo: { fontFamily: F.med, color: C.ink, fontSize: 16, lineHeight: 23 },
  fuerte: { fontFamily: F.bold, color: C.ink, fontSize: 16 },
  suave: { fontFamily: F.med, color: C.muted, fontSize: 14, lineHeight: 20 },
  chico: { fontFamily: F.semi, color: C.muted, fontSize: 12 },
};

export function Txt({ v = "cuerpo", style, ...p }: TextProps & { v?: Variante }) {
  return <Text {...p} style={[TEXTO[v], style]} />;
}

type Props = { texto: string; onPress?: () => void; variante?: "amarillo" | "oscuro" | "gris"; disabled?: boolean; chico?: boolean; style?: StyleProp<ViewStyle> };

/** Botón de una sola forma: esquina grande, color plano. */
export function Boton({ texto, onPress, variante = "amarillo", disabled, chico, style }: Props) {
  const fondo = variante === "amarillo" ? C.yellow : variante === "oscuro" ? C.dark : C.surface2;
  const tinta = variante === "amarillo" ? C.dark : C.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.boton,
        { backgroundColor: fondo, minHeight: chico ? 44 : 56, paddingHorizontal: chico ? 16 : 24, opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      <Text style={{ fontFamily: F.bold, fontSize: chico ? 14 : 17, color: tinta }}>{texto}</Text>
    </Pressable>
  );
}

/** Entrada con desvanecido y subida suave. */
export function Aparece({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

/** Bloque de carga que late mientras llegan los datos. */
export function Esqueleto({ alto = 100, style }: { alto?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [v]);
  return <Animated.View style={[{ height: alto, borderRadius: R, backgroundColor: C.surface, opacity: v }, style]} />;
}

export function Panel({ children, color = C.surface, style }: { children: ReactNode; color?: string; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: color, borderRadius: R, padding: 20 }, style]}>{children}</View>;
}

/** Título de pantalla de póster: letra enorme que sube al entrar, con una línea de apoyo. */
export function Titulo({ texto, sub }: { texto: string; sub?: string }) {
  const { width } = useWindowDimensions();
  const tam = Math.min(88, Math.round((width - 40) / (texto.length * 0.58)));
  return (
    <View style={{ gap: 10 }}>
      <Aparece>
        <Text style={{ fontFamily: F.xbold, fontSize: tam, lineHeight: tam * 1.02, letterSpacing: -tam * 0.04, color: C.ink }}>{texto}</Text>
      </Aparece>
      {!!sub && (
        <Aparece delay={250}>
          <Text style={{ fontFamily: F.med, fontSize: 17, lineHeight: 24, color: C.ink }}>{sub}</Text>
        </Aparece>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  boton: { borderRadius: R, alignItems: "center", justifyContent: "center", flexDirection: "row" },
});
