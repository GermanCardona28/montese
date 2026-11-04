import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { C, F, Rs } from "@/theme";
import { Txt } from "@/components/ui";
import { coloresBus, type EmpresaFlota } from "@/lib/rutas";

/** Marca "La Buseta": buseta amarilla de frente; el parabrisas forma la "M" de Móntese.
 *  Va sobre placa verde; sin ella (`sinPlaca`) solo para fondos claros, como el mapa. */
export function LogoMark({ size = 40, sinPlaca }: { size?: number; sinPlaca?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      {!sinPlaca && <Rect width="512" height="512" rx="116" fill="#1f9d55" />}
      <Rect x="84" y="150" width="30" height="72" rx="13" fill="#191919" />
      <Rect x="398" y="150" width="30" height="72" rx="13" fill="#191919" />
      <Rect x="104" y="166" width="24" height="14" fill="#191919" />
      <Rect x="384" y="166" width="24" height="14" fill="#191919" />
      <Rect x="150" y="372" width="58" height="60" rx="16" fill="#191919" />
      <Rect x="304" y="372" width="58" height="60" rx="16" fill="#191919" />
      <Rect x="122" y="84" width="268" height="316" rx="58" fill="#ffd500" />
      <Rect x="186" y="104" width="140" height="28" rx="14" fill="#191919" />
      <Path d="M144 302V168a18 18 0 0 1 18-18h26l68 78 68-78h26a18 18 0 0 1 18 18v134h-54v-74l-58 66-58-66v74Z" fill="#191919" />
      <Circle cx="170" cy="348" r="21" fill="#fff" />
      <Circle cx="342" cy="348" r="21" fill="#fff" />
      <Rect x="216" y="338" width="80" height="20" rx="10" fill="#191919" />
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
