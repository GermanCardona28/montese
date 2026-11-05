"use client";

import { useEffect, useRef } from "react";

/**
 * Doble toque en una pestaña de la barra: cada pantalla escucha con su nombre y vuelve a su estado inicial
 * (cierra el detalle, limpia la búsqueda, sube al principio…).
 */
const EVENTO = "montese:reinicio";
const ultimo: Record<string, number> = {};

/** Se llama en cada toque a una pestaña; si es el segundo seguido, avisa a la pantalla. */
export function toquePestana(nombre: string) {
  const ahora = Date.now();
  if (ahora - (ultimo[nombre] ?? 0) < 500) window.dispatchEvent(new CustomEvent(EVENTO, { detail: nombre }));
  ultimo[nombre] = ahora;
}

export function useReinicioPestana(nombre: string, accion: () => void) {
  const ref = useRef(accion);
  useEffect(() => {
    ref.current = accion;
  });
  useEffect(() => {
    const f = (e: Event) => {
      if ((e as CustomEvent<string>).detail === nombre) ref.current();
    };
    window.addEventListener(EVENTO, f);
    return () => window.removeEventListener(EVENTO, f);
  }, [nombre]);
}
