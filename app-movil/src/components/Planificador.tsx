import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Boton, Txt } from "@/components/ui";
import { buscarLugar, codificarLugar, miUbicacion, miUbicacionSiHayPermiso, resolverLugar, type Lugar } from "@/lib/lugares";
import { C, F, R } from "@/theme";

type Campo = "a" | "b";

const CLAVE_RECIENTES = "montese.recientes";
const CLAVE_GUARDADOS = "montese.guardados";

/** Un lugar con el nombre que le puso la persona: "Casa", "Trabajo", "Casa de mi amigo"… */
type Guardado = { nombre: string; lugar: Lugar };

/** Planificador A→B: busca sitios, usa tu ubicación, recuerda tus destinos recientes y guarda lugares con tu propio nombre. */
export default function Planificador() {
  const [lugar, setLugar] = useState<Record<Campo, Lugar | null>>({ a: null, b: null });
  const [texto, setTexto] = useState<Record<Campo, string>>({ a: "", b: "" });
  const [activo, setActivo] = useState<Campo>("a");
  const [sugerencias, setSugerencias] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [recientes, setRecientes] = useState<Lugar[]>([]);
  const [guardados, setGuardados] = useState<Guardado[]>([]);
  const [nombrando, setNombrando] = useState<Campo | null>(null);
  const [alias, setAlias] = useState("");
  const abort = useRef<AbortController | null>(null);

  // Menos esfuerzo: si ya hay permiso, el punto de partida es tu ubicación; y se recuerdan los destinos recientes
  useEffect(() => {
    AsyncStorage.getItem(CLAVE_RECIENTES)
      .then((v) => v && setRecientes(JSON.parse(v)))
      .catch(() => {});
    AsyncStorage.getItem(CLAVE_GUARDADOS)
      .then((v) => v && setGuardados(JSON.parse(v)))
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

  // Lupa del teclado: busca en el momento, sin esperar la pausa de escritura
  const buscarYa = async (c: Campo) => {
    const q = texto[c].trim();
    if (q.length < 2) return;
    setActivo(c);
    abort.current?.abort();
    abort.current = new AbortController();
    setBuscando(true);
    setAviso("");
    try {
      const r = await buscarLugar(q, abort.current.signal);
      setSugerencias(r);
      if (!r.length) setAviso("No encontré ese sitio en el área metropolitana. Prueba con el barrio o un lugar conocido.");
      else if (r.length === 1) await elegir(c, r[0]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setAviso("No pude buscar ahora mismo. Revisa tu conexión.");
    } finally {
      setBuscando(false);
    }
  };

  // Lugares guardados con nombre propio
  const persistir = (g: Guardado[]) => {
    setGuardados(g);
    AsyncStorage.setItem(CLAVE_GUARDADOS, JSON.stringify(g)).catch(() => {});
  };
  const guardar = (c: Campo) => {
    const l = lugar[c];
    const n = alias.trim();
    if (!l || !n) return;
    persistir([{ nombre: n, lugar: { ...l, nombre: n } }, ...guardados.filter((g) => g.nombre.toLowerCase() !== n.toLowerCase())].slice(0, 12));
    setNombrando(null);
    setAlias("");
    setAviso(`Guardé este lugar como “${n}”.`);
  };
  const quitar = (n: string) => persistir(guardados.filter((g) => g.nombre !== n));
  const usarGuardado = (g: Guardado) => elegir(lugar.a ? "b" : activo, { ...g.lugar, nombre: g.nombre });
  const yaGuardado = (l: Lugar) => guardados.some((g) => Math.abs(g.lugar.pos[0] - l.pos[0]) < 1e-4 && Math.abs(g.lugar.pos[1] - l.pos[1]) < 1e-4);

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
        onSubmitEditing={() => buscarYa(c)}
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

      {guardados.length > 0 && (
        <View style={s.chips}>
          {guardados.map((g) => (
            <View key={g.nombre} style={s.chipGuardado}>
              <Pressable onPress={() => usarGuardado(g)} accessibilityRole="button" accessibilityLabel={`Usar ${g.nombre}`}>
                <Txt style={[s.chipTxt, { color: "#fff" }]}>★ {g.nombre}</Txt>
              </Pressable>
              <Pressable onPress={() => quitar(g.nombre)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Quitar ${g.nombre}`}>
                <Txt style={[s.chipTxt, { color: "#ffffffaa" }]}>✕</Txt>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {(["a", "b"] as Campo[]).map((c) => {
        const l = lugar[c];
        if (!l || yaGuardado(l) || nombrando) return null;
        return (
          <View key={c} style={s.chips}>
            <Pressable onPress={() => { setNombrando(c); setAlias(""); }} style={s.chipClaro} accessibilityRole="button">
              <Txt style={s.chipTxt}>★ Guardar {c === "a" ? "el punto A" : "el punto B"} con un nombre</Txt>
            </Pressable>
          </View>
        );
      })}

      {nombrando && (
        <View style={{ marginTop: 14, gap: 10 }}>
          <Txt style={{ color: C.dark, fontFamily: F.semi, fontSize: 14 }}>¿Cómo quieres llamar a “{lugar[nombrando]?.nombre}”?</Txt>
          <TextInput
            style={s.campo}
            value={alias}
            onChangeText={setAlias}
            placeholder="Casa, Trabajo, Casa de mi amigo…"
            placeholderTextColor="#6b6b6b"
            maxLength={30}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => guardar(nombrando)}
            accessibilityLabel="Nombre del lugar"
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Boton texto="Guardar" variante="oscuro" chico disabled={!alias.trim()} onPress={() => guardar(nombrando)} />
            <Pressable onPress={() => { setNombrando(null); setAlias(""); }} style={s.chipClaro} accessibilityRole="button">
              <Txt style={s.chipTxt}>Cancelar</Txt>
            </Pressable>
          </View>
        </View>
      )}

      {recientes.length > 0 && (
        <View style={s.chips}>
          {recientes.map((r) => (
            <Pressable key={r.nombre} onPress={() => elegir(lugar.a ? "b" : activo, r)} style={s.chipOscuro} accessibilityRole="button">
              <Txt style={[s.chipTxt, { color: "#fff" }]}>↺ {r.nombre}</Txt>
            </Pressable>
          ))}
        </View>
      )}

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
  chipGuardado: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.green, borderRadius: R, paddingHorizontal: 16, paddingVertical: 10 },
  chipOscuro: { backgroundColor: C.dark, borderRadius: R, paddingHorizontal: 16, paddingVertical: 10 },
  chipTxt: { color: C.dark, fontFamily: F.semi, fontSize: 14 },
});
