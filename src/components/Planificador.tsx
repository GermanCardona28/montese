"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarLugar, codificarLugar, miUbicacion, resolverLugar, type Lugar } from "@/lib/lugares";

type Campo = "a" | "b";

const CLAVE_RECIENTES = "montese.recientes";
const CLAVE_GUARDADOS = "montese.guardados";

/** Un lugar con el nombre que le puso la persona: "Casa", "Trabajo", "Casa de mi amigo"… */
type Guardado = { nombre: string; lugar: Lugar };

export default function Planificador() {
  const router = useRouter();
  const [lugar, setLugar] = useState<Record<Campo, Lugar | null>>({ a: null, b: null });
  const [texto, setTexto] = useState<Record<Campo, string>>({ a: "", b: "" });
  const [activo, setActivo] = useState<Campo>("a");
  const [sugerencias, setSugerencias] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState("");
  const abort = useRef<AbortController | null>(null);
  const [recientes, setRecientes] = useState<Lugar[]>([]);
  const [guardados, setGuardados] = useState<Guardado[]>([]);
  const [nombrando, setNombrando] = useState<Campo | null>(null);
  const [alias, setAlias] = useState("");

  // Menos esfuerzo: si ya hay permiso, el punto de partida es tu ubicación; y se recuerdan los destinos recientes
  useEffect(() => {
    try {
      setRecientes(JSON.parse(localStorage.getItem(CLAVE_RECIENTES) ?? "[]"));
      setGuardados(JSON.parse(localStorage.getItem(CLAVE_GUARDADOS) ?? "[]"));
    } catch {}
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => {
        if (p.state === "granted") miUbicacion().then((l) => elegirInicial(l)).catch(() => {});
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elegirInicial = (l: Lugar) => {
    setLugar((p) => (p.a ? p : { ...p, a: l }));
    setTexto((p) => (p.a ? p : { ...p, a: l.nombre }));
    setActivo("b");
  };

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
      elegir("a", await miUbicacion());
    } catch {
      setAviso("No pude obtener tu ubicación. Activa el permiso o escribe el sitio.");
    }
  };

  // Lupa del teclado (Enter): busca en el momento, sin esperar la pausa de escritura
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
    try {
      localStorage.setItem(CLAVE_GUARDADOS, JSON.stringify(g));
    } catch {}
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

  const listo = lugar.a && lugar.b;
  const ir = () => {
    if (!lugar.a || !lugar.b) return;
    try {
      const nuevo = [lugar.b, ...recientes.filter((r) => r.nombre !== lugar.b!.nombre)].slice(0, 5);
      localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(nuevo));
    } catch {}
    router.push(`/viaje/?a=${codificarLugar(lugar.a)}&b=${codificarLugar(lugar.b)}`);
  };

  const fila = (c: Campo) => (
    <div className="flex items-center gap-3">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-bold text-white"
        style={{ background: c === "a" ? "var(--green)" : "var(--blue)" }}
        aria-hidden="true"
      >
        {c === "a" ? "A" : "B"}
      </span>
      <input
        className="campo"
        value={texto[c]}
        onFocus={() => setActivo(c)}
        onChange={(e) => {
          setTexto((p) => ({ ...p, [c]: e.target.value }));
          setLugar((p) => ({ ...p, [c]: null }));
        }}
        placeholder={c === "a" ? "¿Dónde estás?" : "¿A dónde vas?"}
        aria-label={c === "a" ? "Punto de partida" : "Destino"}
        autoComplete="off"
        enterKeyHint="search"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            buscarYa(c);
          }
        }}
      />
    </div>
  );

  return (
    <div className="rounded-[var(--r)] bg-yellow p-4 text-[#111] md:p-6">
      <div className="flex flex-col gap-3">
        {fila("a")}
        {fila("b")}
      </div>

      {(sugerencias.length > 0 || buscando) && (
        <ul className="rise mt-3 overflow-hidden rounded-[var(--r)] bg-white" style={{ ["--d" as string]: "0ms" }}>
          {buscando && <li className="px-5 py-3 text-[#555]">Buscando…</li>}
          {sugerencias.map((s, i) => (
            <li key={`${s.pos.join()}-${i}`}>
              <button
                onClick={() => elegir(activo, s)}
                className="block w-full px-5 py-3 text-left transition-colors hover:bg-[#fff6a8]"
              >
                <span className="block font-semibold">{s.nombre}</span>
                {s.detalle && <span className="block text-sm text-[#555]">{s.detalle}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {aviso && <p className="mt-3 text-[0.95rem] font-medium">{aviso}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={usarUbicacion} className="btn btn-dark !min-h-11 !px-4 !text-base">
          Usar mi ubicación
        </button>
        <button onClick={invertir} className="btn !min-h-11 !px-4 !text-base bg-[#111]/10 text-[#111] hover:bg-[#111]/20">
          Invertir
        </button>
      </div>

      {guardados.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Mis lugares">
          {guardados.map((g) => (
            <span key={g.nombre} className="inline-flex items-center gap-2.5 rounded-[var(--r)] bg-green px-4 py-2 text-[0.95rem] font-semibold text-white">
              <button onClick={() => usarGuardado(g)} aria-label={`Usar ${g.nombre}`}>★ {g.nombre}</button>
              <button onClick={() => quitar(g.nombre)} className="text-white/70 hover:text-white" aria-label={`Quitar ${g.nombre}`}>✕</button>
            </span>
          ))}
        </div>
      )}

      {!nombrando &&
        (["a", "b"] as Campo[]).map((c) => {
          const l = lugar[c];
          if (!l || yaGuardado(l)) return null;
          return (
            <div key={c} className="mt-3">
              <button
                onClick={() => {
                  setNombrando(c);
                  setAlias("");
                }}
                className="rounded-[var(--r)] bg-[#111]/10 px-4 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-[#111]/20"
              >
                ★ Guardar el punto {c.toUpperCase()} con un nombre
              </button>
            </div>
          );
        })}

      {nombrando && (
        <div className="mt-4 flex flex-col gap-2.5">
          <p className="text-[0.95rem] font-semibold">¿Cómo quieres llamar a “{lugar[nombrando]?.nombre}”?</p>
          <input
            className="campo"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && guardar(nombrando)}
            placeholder="Casa, Trabajo, Casa de mi amigo…"
            maxLength={30}
            autoFocus
            aria-label="Nombre del lugar"
          />
          <div className="flex gap-2">
            <button onClick={() => guardar(nombrando)} disabled={!alias.trim()} className="btn btn-dark !min-h-11 !px-4 !text-base">
              Guardar
            </button>
            <button
              onClick={() => {
                setNombrando(null);
                setAlias("");
              }}
              className="btn !min-h-11 !px-4 !text-base bg-[#111]/10 text-[#111] hover:bg-[#111]/20"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {recientes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Destinos recientes">
          {recientes.map((r) => (
            <button
              key={r.nombre}
              onClick={() => elegir(lugar.a ? "b" : activo, r)}
              className="rounded-[var(--r)] bg-[#111] px-4 py-2 text-[0.95rem] font-semibold text-white transition-transform active:scale-95"
            >
              ↺ {r.nombre}
            </button>
          ))}
        </div>
      )}

      <button onClick={ir} disabled={!listo} className="btn btn-dark mt-5 w-full">
        Ver cómo llegar
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
