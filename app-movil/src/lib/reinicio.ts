import { useEffect, useRef } from "react";

/**
 * Doble toque en el ícono de una pestaña: cada pantalla se suscribe con su nombre y, cuando llega el aviso,
 * vuelve a su estado inicial (cerrar el detalle, limpiar la búsqueda, subir al principio…).
 */
type Fn = () => void;
const oyentes = new Map<string, Set<Fn>>();

export function reiniciarPestana(nombre: string) {
  oyentes.get(nombre)?.forEach((f) => f());
}

export function useReinicioPestana(nombre: string, accion: Fn) {
  const ref = useRef(accion);
  useEffect(() => {
    ref.current = accion;
  });
  useEffect(() => {
    const f: Fn = () => ref.current();
    const set = oyentes.get(nombre) ?? new Set<Fn>();
    set.add(f);
    oyentes.set(nombre, set);
    return () => {
      set.delete(f);
    };
  }, [nombre]);
}
