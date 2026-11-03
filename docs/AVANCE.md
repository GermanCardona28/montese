# Móntese — Registro de avance

## Datos cargados en Supabase
| Elemento | Cantidad | Fuente |
|---|---|---|
| Empresas | 12 (11 de buses + Metrolínea) | AMB |
| Rutas de transporte colectivo (TPC) | 45 | [AMB – rutas públicas colectivo complementario](http://www.amb.gov.co/rutas-publico-colectivo-complementario/) |
| Horarios (primer/último despacho) | 45 | AMB |
| Frecuencias pico/valle | 45 | AMB (unidad asumida: minutos, sin confirmar) |
| Tarifas | 45 | Vanguardia, 19-ene-2024 (por verificar, pudieron cambiar) |

## Mapa (nuevo)
- Pantalla Mapa con MapLibre + mosaicos de OpenStreetMap, trazados en el color de cada empresa y botón de ubicación.
- Trazados cargados: 45 de 45, tomados de los mapas oficiales (Google My Maps) que el AMB incrusta en su web, simplificados a 8 m y guardados como polilínea codificada (`routes.trazado_polyline`). Cada trazado es un solo recorrido (ida y vuelta juntos). Además se guardaron terminal, recorrido en texto y longitud en km (44 con recorrido).
- Interacción: tocar el número de una ruta la resalta y muestra empresa, terminal y longitud.
- Paradas: 0. Los mapas del AMB solo traen la línea, sin puntos de parada; la tabla `stops` sigue vacía.
- Importación: se hizo con una función temporal de Supabase (`importar-amb-temporal`) ya neutralizada (responde 410); se puede borrar desde el panel.
- Los mosaicos de tile.openstreetmap.org sirven para desarrollo; para publicar hay que usar un proveedor propio (MapTiler, Stadia, etc.).

## Metrolínea (investigado el 2026-11-03)
- No se cargaron rutas de Metrolínea: no hay listado oficial vigente. Según Vanguardia (21-oct-2026) Metrolínea "no está habilitada para operar buses", sus troncales/pretroncales no tienen operador y el nuevo esquema (empresa pública u operador privado) no está definido.
- Su visor oficial de rutas carga datos desde un servidor de terceros con login y reCAPTCHA; no se accedió a él.
- Lo único verificable: tarifas unificadas 2026 en los 4 municipios, bus y Sitme: corta $3.000, larga $3.600 (Vanguardia, 5-ene-2026). Rutas Sitme citadas: Portal del Norte–Provenza, UIS–Provenza, Provenza–Centro, Portal Girón–Portal Norte (cortas) y Piedecuesta–Quebrada Seca (larga). Sin trazado ni horario.
- Las 17 rutas "complementarias" que dependen de Metrolínea las opera el transporte colectivo; ya están entre las 45 del AMB.
- Las tarifas de las 45 rutas se actualizaron a 2026 por inferencia (2.400→3.000 y 3.000→3.600); falta confirmar ruta por ruta.

## Pendiente de datos
- Rutas de Metrolínea (troncales, pretroncales, alimentadoras): no hay GTFS ni datos abiertos; hay que levantarlas de sus documentos/app.
- Trazados (mapa) y paradas de cada ruta: el AMB los muestra en su web pero no ofrece archivo descargable.
- Ventana exacta de hora pico (hoy se estima 6:00–8:30 y 16:30–19:30).
- Sentido ida/vuelta y diferencias por día (sábado, domingo/festivo).

## Pantallas hechas
Inicio, Rutas (búsqueda, estado "en servicio", frecuencia actual, detalle), Empresas (por empresa), Alertas (placeholder).

## Cómo ver el avance
- Web local: `npm run dev` → http://localhost:3000 (usar vista móvil del navegador).
- App Android: `npm run build; npx cap sync android; npx cap open android` (requiere Android Studio).

## Referentes de diseño
Citymapper (comparación clara de opciones), Transit (tarjetas de próximas llegadas), Moovit (cobertura y planificador).

## Cambios del 2026-11-03 (segunda ronda)
- Marca: logo y paleta pasan a amarillo + verde (sin rojo); tipografía Plus Jakarta Sans; página `/tipografias` para comparar alternativas.
- Inicio compacto en celular (pasos en filas delgadas, cifras y cierre más bajos).
- Planificador estilo Moovit: bus directo, caminar, y un transbordo entre dos rutas (a pie hasta 300 m); pasos detallados con tiempo de espera, viaje y caminatas; etiquetas "Más rápida", "Te deja más cerca", "Menos caminata". Toma tu ubicación si ya hay permiso y recuerda destinos recientes.
- Flota: colores de cada empresa (observados en fotos; confianza alta/media/baja) en rutas, mapa, viaje y empresas.
- Mapa: tocar una ruta muestra el recorrido completo con el bus animado; MapLibre por defecto y Google Maps si hay clave (`.env.example`).
- Google Maps: mapa base, búsqueda de lugares (Places New), capa de tráfico y factor de tráfico (Routes API). Sin probar: falta la clave.
- Waze: no tiene API pública de tráfico (solo socios aprobados vía Waze Transport SDK / Waze for Cities para entidades); no se integró.
- Metrolínea: 12 líneas listadas (P1, P2, P3, P8, P10, P14, P16N, P16S, P18, P19, RD15, RD27) según Moovit/Vanguardia, marcadas "por verificar", sin trazado ni horario; no entran al planificador. El visor oficial devolvió el menú vacío.
- Lebrija: Translebrija (Lebrija–Bucaramanga y Lebrija–Girón) listada "por verificar". Los Santos: sin datos verificables.
