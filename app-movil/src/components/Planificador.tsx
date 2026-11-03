import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Boton, Txt } from "@/components/ui";
import { buscarLugar, codificarLugar, miUbicacion, miUbicacionSiHayPermiso, resolverLugar, type Lugar } from "@/lib/lugares";
import { C, F, R } from "@/theme";

type Campo = "a" | "b";

const CLAVE_RECIENTES = "montese.recientes";
const ATAJOS = ["UIS", "Cabecera", "Cañaveral", "Centro", "Terminal de Transportes", "Floridablanca", "Girón", "Piedecuesta"];

/** Planificador A→B: busca sitios, usa tu ubicación y recuerda tus destinos recientes. */
export default function Planificador() {
  const [lugar, setLugar] = useState<Record<Campo, Lugar | null>>({ a: null, b: null });
  const [texto, setTexto] = useState<Record<Campo, string>>({ a: "", b: "" });
  const [activo, setActivo] = useState<Campo>("a");
  const [sugerencias, setSugerencias] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [recientes, setRecientes] = useState<Lugar[]>([]);
  const abort = useRef<AbortController | null>(null);

  // Menos esfuerzo: si ya hay permiso, el punto de partida es tu ubicación; y se recuerdan los destinos recientes
  useEffect(() => {
    AsyncStorage.getItem(CLAVE_RECIENTES)
      .then((v) => v && setRecientes(JSON.parse(v)))
      .catch(() => {});
    miUbicacionSiHayPermiso()
      .then((l) => {
        if (!l) return;
        setLugar((p) => (p.a ? p : { ...p, a: l }));
        setTexto((p) => (p.a ? p : { ...p, a: l.nombre }));
        setActivo("b");
      })
      .catch(() => {});
  }, []);

  // Búsqueda con pausa para respetar el límite de 1 petición por segundo del geocodificador
  useEffect(() => {
    const q = texto[activo].trim();
    if (q.length < 3 || lugar[activo]?.nombre === q) {
      setSugerencias([]);
      return;
    }
    const t = setTimeout(async () => {
      abort.current?.abort();
      abort.current = new AbortController();
      setBuscando(true);
      setAviso("");
      try {
        const r = await buscarLugar(q, abort.current.signal);
        setSugerencias(r);
        if (!r.length) setAviso("No encontré ese sitio en el área metropolitana. Prueba con el barrio o un lugar conocido.");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setAviso("No pude buscar ahora mismo. Revisa tu conexión.");
      } finally {
        setBuscando(false);
      }
    }, 650);
    return () => clearTimeout(t);
  }, [texto, activo, lugar]);

  const elegir = async (c: Campo, sugerido: Lugar) => {
    let l = sugerido;
    try {
      l = await resolverLugar(sugerido);
    } catch {
      setAviso("No pude ubicar ese sitio. Prueba con otro.");
      return;
    }
    setLugar((p) => ({ ...p, [c]: l }));
    setTexto((p) => ({ ...p, [c]: l.nombre }));
    setSugerencias([]);
    setAviso("");
    if (c === "a" && !lugar.b) setActivo("b");
  };

  const usarUbicacion = async () => {
    setAviso("");
    try {
      await elegir("a", await miUbicacion());
    } catch {
      setAviso("No pude obtener tu ubicación. Activa el permiso o escribe el sitio.");
    }
  };

  const atajo = async (q: string) => {
    const c: Campo = lugar.a && !lugar.b ? "b" : activo;
    setAviso("");
    try {
      const r = await buscarLugar(q);
      if (r[0]) await elegir(c, r[0]);
      else setAviso("No encontré ese sitio.");
    } catch {
      setAviso("No pude buscar ahora mismo.");
    }
  };

  const invertir = () => {
    setLugar((p) => ({ a: p.b, b: p.a }));
    setTexto((p) => ({ a: p.b, b: p.a }));
  };

  const ir = () => {
    if (!lugar.a || !lugar.b) return;
    const nuevo = [lugar.b, ...recientes.filter((r) => r.nombre !== lugar.b!.nombre)].slice(0, 5);
    AsyncStorage.setItem(CLAVE_RECIENTES, JSON.stringify(nuevo)).catch(() => {});
    router.push({ pathname: "/viaje", params: { a: codificarLugar(lugar.a), b: codificarLugar(lugar.b) } });
  };

  const fila = (c: Campo) => (
    <View style={s.fila}>
      <View style={[s.letra, { backgroundColor: c === "a" ? C.green : C.blue }]}>
        <Txt style={s.letraTxt}>{c === "a" ? "A" : "B"}</Txt>
      </View>
      <TextInput
        style={s.campo}
        value={texto[c]}
        onFocus={() => setActivo(c)}
        onChangeText={(t) => {
          setTexto((p) => ({ ...p, [c]: t }));
          setLugar((p) => ({ ...p, [c]: null }));
        }}
        placeholder={c === "a" ? "¿Dónde estás?" : "¿A dónde vas?"}
        placeholderTextColor="#6b6b6b"
        accessibilityLabel={c === "a" ? "Punto de partida" : "Destino"}
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );

  return (
    <View style={s.panel}>
      <View style={{ gap: 12 }}>
        {fila("a")}
        {fila("b")}
      </View>

      {(buscando || sugerencias.length > 0) && (
        <View style={s.lista}>
          {buscando && <Txt style={s.sug}>Buscando…</Txt>}
          {sugerencias.map((x, i) => (
            <Pressable key={`${x.pos.join()}-${i}`} onPress={() => elegir(activo, x)} style={({ pressed }) => [s.item, pressed && { backgroundColor: "#fff6a8" }]}>
              <Txt style={{ fontFamily: F.bold, color: C.dark, fontSize: 16 }}>{x.nombre}</Txt>
              {!!x.detalle && <Txt style={{ color: "#555", fontSize: 13 }}>{x.detalle}</Txt>}
            </Pressable>
          ))}
        </View>
      )}
      {!!aviso && <Txt style={{ color: C.dark, marginTop: 12, fontFamily: F.semi, fontSize: 14 }}>{aviso}</Txt>}

      <View style={s.chips}>
        <Boton texto="Usar mi ubicación" variante="oscuro" chico onPress={usarUbicacion} />
        <Pressable onPress={invertir} style={s.chipClaro} accessibilityRole="button">
          <Txt style={s.chipTxt}>Invertir</Txt>
        </Pressable>
      </View>

      {recientes.length > 0 && (
        <View style={s.chips}>
          {recientes.map((r) => (
            <Pressable key={r.nombre} onPress={() => elegir(lugar.a ? "b" : activo, r)} style={s.chipOscuro} accessibilityRole="button">
              <Txt style={[s.chipTxt, { color: "#fff" }]}>↺ {r.nombre}</Txt>
            </Pressable>
          ))}
        </View>
      )}

      <View style={s.chips}>
        {ATAJOS.map((q) => (
          <Pressable key={q} onPress={() => atajo(q)} style={s.chipClaro} accessibilityRole="button">
            <Txt style={s.chipTxt}>{q}</Txt>
          </Pressable>
        ))}
      </View>

      <Boton texto="Ver cómo llegar →" variante="oscuro" disabled={!lugar.a || !lugar.b} onPress={ir} style={{ marginTop: 18 }} />
    </View>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: C.yellow, borderRadius: R, padding: 16 },
  fila: { flexDirection: "row", alignItems: "center", gap: 10 },
  letra: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  letraTxt: { color: "#fff", fontFamily: F.xbold, fontSize: 18 },
  campo: { flex: 1, minHeight: 56, borderRadius: R, backgroundColor: "#fff", paddingHorizontal: 20, fontFamily: F.med, fontSize: 17, color: C.dark },
  lista: { backgroundColor: "#fff", borderRadius: R, marginTop: 12, overflow: "hidden" },
  sug: { color: "#555", padding: 16 },
  item: { paddingHorizontal: 20, paddingVertical: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chipClaro: { backgroundColor: "#0000001a", borderRadius: R, paddingHorizontal: 16, paddingVertical: 10 },
  chipOscuro: { backgroundColor: C.dark, borderRadius: R, paddingHorizontal: 16, paddingVertical: 10 },
  chipTxt: { color: C.dark, fontFamily: F.semi, fontSize: 14 },
});
