"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarLugar, codificarLugar, miUbicacion, resolverLugar, type Lugar } from "@/lib/lugares";

type Campo = "a" | "b";

const CLAVE_RECIENTES = "montese.recientes";

const ATAJOS = ["UIS", "Cabecera", "Cañaveral", "Centro", "Terminal de Transportes", "Floridablanca", "Girón", "Piedecuesta"];

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

  // Menos esfuerzo: si ya hay permiso, el punto de partida es tu ubicación; y se recuerdan los destinos recientes
  useEffect(() => {
    try {
      setRecientes(JSON.parse(localStorage.getItem(CLAVE_RECIENTES) ?? "[]"));
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

  const atajo = async (q: string) => {
    const c: Campo = lugar.a && !lugar.b ? "b" : activo;
    setAviso("");
    try {
      const r = await buscarLugar(q);
      if (r[0]) elegir(c, r[0]);
      else setAviso("No encontré ese sitio.");
    } catch {
      setAviso("No pude buscar ahora mismo.");
    }
  };

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

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Sitios frecuentes">
        {ATAJOS.map((q) => (
          <button
            key={q}
            onClick={() => atajo(q)}
            className="rounded-[var(--r)] bg-[#111]/10 px-4 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-[#111]/20 active:scale-95"
          >
            {q}
          </button>
        ))}
      </div>

      <button onClick={ir} disabled={!listo} className="btn btn-dark mt-5 w-full">
        Ver cómo llegar
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
