# Móntese — Identidad de marca y diseño

## Idea
**"Móntese en el bus."** Una invitación directa, en el habla de Bucaramanga, para estudiantes, trabajadores y gente de clase media que se mueve en bus.

**Idea visual:** el *cartel de ruta* (el letrero con el número que lleva cada bus) es el elemento central. Cada ruta de la app es una placa amarilla con su número en negro; los buses colombianos pintados de rojo, azul, verde y amarillo dan la paleta. Es un cartel callejero: color plano, letra pesada, frases cortas.

## Logo
Un bus amarillo visto de frente con letrero verde; el parabrisas verde forma la **M** de Móntese. Amarillo y verde son los colores de la mayoría de flotas de la región. Archivo: `src/components/Logo.tsx`.

## Color
| Rol | Valor |
|---|---|
| Fondo (carbón) | `#191919` · superficie `#242424` / `#2f2f2f` |
| Amarillo (marca, acción, cartel de ruta) | `#ffd500` |
| Verde | `#1f9d55` |
| Azul (flota de Piedecuesta) | `#1e6fd9` |
| Rojo (solo errores y avisos) | `#e5484d` |
| Texto | blanco; atenuado `#a9a9a9` |

Cada panel es un solo color plano; sin degradados, sombras ni líneas finas. Los colores de las empresas (12 tonos) solo se usan para las líneas del mapa y un punto en las listas.

## Tipografía
**Plus Jakarta Sans** (autoalojada en `public/fonts`). Titulares en 800, texto en 400–600. Para comparar otras opciones: `/tipografias`.

## Formas
Una sola esquina grande (`--r: 28px`) en paneles, botones y campos; el cartel usa `--r-sm: 12px`.

## Movimiento
- Titular enmascarado: cada línea sube desde su base al cargar.
- Entrada escalonada de tarjetas y listas; transición suave entre pantallas.
- Escena de inicio: un bus recorre la calle con ruedas que giran y paradas que laten.
- Mapa: el bus de la marca recorre el trazado de la ruta elegida o el tramo del viaje (A→B).
- Cifras que cuentan al aparecer; esqueletos de carga; respuesta al tocar en cada botón.
- Todo respeta `prefers-reduced-motion`.

## Pantallas
- **Inicio:** titular, planificador (A→B con búsqueda de sitios, “usar mi ubicación” y atajos), cómo funciona, cifras reales y cierre.
- **Viaje:** mapa con el tramo en bus, caminatas y marcadores A/B, y las opciones con tiempo total, hora de llegada, pasaje, etapas y avisos.
- **Rutas / Mapa / Empresas / Alertas.**

## Cómo se calcula un viaje
Para cada ruta se busca el punto de su trazado más cercano a A y a B (máx. 800 m a pie) con B después de A en el sentido del recorrido. Tiempo = caminata (4,5 km/h) + espera (mitad de la frecuencia de la franja) + bus (16 km/h en valle, 11 km/h en hora pico). **Son supuestos**, no datos medidos; no incluye tráfico en vivo ni transbordos.

## Referencias
Dirección dealt con la skill *tasteskill* (“Loud and flat”): ver `docs/direccion-visual-hoja.txt`. Inspiración de producto: Citymapper, Transit, Moovit.
