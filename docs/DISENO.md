# Móntese — Diseño inicial

App Android de transporte público masivo del área metropolitana de Bucaramanga
(Bucaramanga, Floridablanca, Girón, Piedecuesta). Metrolínea y buses/busetas de empresas privadas.

## Stack
- Next.js (App Router) + Tailwind — UI
- Capacitor — empaquetado a Android (APK/AAB), geolocalización, notificaciones
- Supabase (Postgres + PostGIS) — datos, auth, realtime
- Mapas: MapLibre GL + OpenStreetMap (sin costo por uso)

## Funcionalidades (MVP)
1. Directorio de empresas y rutas (número, nombre, trayecto, tarifa).
2. Mapa con trazado de rutas y paradas.
3. Planificador "de A a B": rutas directas y con transbordo, tiempo estimado.
4. Horarios: primera/última salida, frecuencia por franja, hora pico vs valle.
5. Próximas llegadas a una parada (estimadas por horario/frecuencia).
6. Reportes de la comunidad: trancones, retrasos, cierres (con expiración).

## Fases posteriores
- Posición en vivo de buses (GPS de conductores o reportes colaborativos).
- Alertas push por ruta favorita.
- Modo sin conexión (rutas y horarios en caché).
- Tarifas, medios de pago (tarjeta Metrolínea).

## Modelo de datos (Supabase)
- `companies` — id, nombre, tipo (masivo/colectivo), contacto
- `routes` — id, company_id, código, nombre, color, tarifa, activa, trazado (geography linestring)
- `stops` — id, nombre, ubicación (geography point), municipio
- `route_stops` — route_id, stop_id, sentido (ida/vuelta), orden
- `schedules` — route_id, sentido, día_tipo (lun-vie/sáb/dom-festivo), primera_salida, última_salida
- `frequencies` — route_id, sentido, día_tipo, franja (hora inicio/fin), minutos_entre_buses, es_hora_pico
- `incidents` — route_id/stop_id, tipo (trancón/retraso/cierre/accidente), descripción, ubicación, reportado_por, creado_en, expira_en

## Riesgo principal: los datos
No hay un feed GTFS oficial completo para las rutas privadas de Bucaramanga. "Todas las rutas"
exige recopilación propia: Metrolínea (datos abiertos/AMB), cartografía colaborativa y
levantamiento en campo. Conviene diseñar un panel de administración para cargar y validar rutas.

## Siguiente paso propuesto
1. Crear el esquema SQL en Supabase (migración).
2. Instalar y configurar Capacitor (Android).
3. Pantallas base: inicio, mapa, detalle de ruta, planificador.
