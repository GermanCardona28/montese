import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { C, F, Rs } from "@/theme";
import { Txt } from "@/components/ui";
import { coloresBus, type EmpresaFlota } from "@/lib/rutas";

/** Marca: un bus amarillo visto de frente; el parabrisas verde forma la "M" de Móntese. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="8" y="8" width="48" height="46" rx="12" fill="#ffd500" />
      <Rect x="16" y="13" width="32" height="8" rx="4" fill="#1f9d55" />
      <Path d="M14 46V27h8l10 10 10-10h8v19h-7v-9.5L32 47l-11-10.5V46Z" fill="#1f9d55" />
      <Circle cx="17" cy="52" r="3.2" fill="#fff" />
      <Circle cx="47" cy="52" r="3.2" fill="#fff" />
      <Rect x="13" y="54" width="11" height="7" rx="3" fill="#191919" />
      <Rect x="40" y="54" width="11" height="7" rx="3" fill="#191919" />
    </Svg>
  );
}

export function Wordmark() {
  return (
    <View style={s.fila}>
      <LogoMark size={36} />
      <Txt style={{ fontFamily: F.bold, fontSize: 24, letterSpacing: -0.6 }}>Móntese</Txt>
    </View>
  );
}

/** Placa de ruta: el letrero amarillo con el número, como en los buses. */
export function Cartel({ codigo, chico }: { codigo: string; chico?: boolean }) {
  return (
    <View style={[s.cartel, chico && { paddingHorizontal: 8, paddingVertical: 4, minWidth: 32 }]}>
      <Txt style={{ fontFamily: F.xbold, color: C.dark, fontSize: chico ? 14 : 20, letterSpacing: -0.8 }}>{codigo}</Txt>
    </View>
  );
}

/** Bus de lado pintado con los colores de la flota: así el usuario sabe qué bus mirar para pararlo. */
export function BusColor({ empresa, ancho = 64 }: { empresa: EmpresaFlota | null; ancho?: number }) {
  const [c1, c2] = empresa?.flota_colores?.length ? coloresBus({ companies: empresa }) : ["#8a8a8a", "#6d6d6d"]; // gris = color sin confirmar
  return (
    <Svg width={ancho} height={ancho / 2} viewBox="0 0 120 60">
      <Rect x="2" y="6" width="116" height="40" rx="9" fill={c1} stroke="#00000033" strokeWidth="1.5" />
      <Rect x="2" y="30" width="116" height="9" fill={c2 ?? c1} />
      <Rect x="9" y="12" width="20" height="15" rx="3" fill="#1a2a30" />
      <Rect x="33" y="12" width="20" height="15" rx="3" fill="#1a2a30" />
      <Rect x="57" y="12" width="20" height="15" rx="3" fill="#1a2a30" />
      <Rect x="83" y="12" width="29" height="22" rx="3" fill="#1a2a30" />
      <G>
        <Circle cx="28" cy="46" r="8" fill="#111" />
        <Circle cx="28" cy="46" r="3" fill="#bbb" />
        <Circle cx="92" cy="46" r="8" fill="#111" />
        <Circle cx="92" cy="46" r="3" fill="#bbb" />
      </G>
    </Svg>
  );
}

/** Texto del color: "amarillo con verde". Indica cuando está por confirmar. */
export function textoFlota(empresa: EmpresaFlota | null): string {
  if (!empresa?.flota_descripcion) return "";
  if (!empresa.flota_colores?.length) return "de color por confirmar";
  const d = empresa.flota_descripcion.charAt(0).toLowerCase() + empresa.flota_descripcion.slice(1);
  return empresa.flota_confianza === "baja" && !d.includes("confirmar") ? `${d} (por confirmar)` : d;
}

/** Tarjeta "Busca un bus amarillo con verde" con el dibujo del bus. */
export function BuscaBus({ empresa }: { empresa: EmpresaFlota | null }) {
  return (
    <View style={s.busca}>
      <BusColor empresa={empresa} ancho={68} />
      <Txt style={{ flex: 1 }}>
        Busca un bus <Txt v="fuerte">{textoFlota(empresa)}</Txt>
      </Txt>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartel: { backgroundColor: C.yellow, borderRadius: Rs, paddingHorizontal: 12, paddingVertical: 6, minWidth: 54, alignItems: "center", justifyContent: "center" },
  busca: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.bg, borderRadius: Rs, padding: 12 },
});
