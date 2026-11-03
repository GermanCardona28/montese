# Móntese — app móvil (React Native + Expo)

App Android (y iOS) de transporte público del área metropolitana de Bucaramanga. TypeScript, Expo SDK 58, Expo Router, `react-native-maps` (Google Maps) y Supabase.

## Probarla en tu celular (lo más rápido)
1. Instala **Expo Go** desde Google Play.
2. En esta carpeta: `npm install` (solo la primera vez) y luego `npx expo start --tunnel`.
3. Escanea el código QR con Expo Go (o abre el enlace `exp://…` que muestra la terminal).

`--tunnel` funciona aunque el PC y el celular estén en redes distintas. Si están en el mismo Wi-Fi, basta `npx expo start`.

## Instalarla como app (APK)
Requiere una cuenta gratuita de Expo (`npx eas-cli login`):

```bash
npx eas-cli build -p android --profile preview
```

Al terminar te da un enlace para descargar el `.apk` e instalarlo en el celular (hay que permitir "instalar apps de orígenes desconocidos").

### Mapa de Google en el APK
Expo Go ya trae el mapa. Para el APK hace falta una clave de **Google Maps SDK for Android**:
1. En Google Cloud habilita **Maps SDK for Android**.
2. Crea una clave restringida a "Apps para Android": paquete `co.montese.app` y la huella SHA-1 del certificado (`npx eas-cli credentials` la muestra).
3. Guárdala en `.env` como `GOOGLE_MAPS_ANDROID_KEY=...` y vuelve a compilar.

### Búsqueda de lugares y tráfico con Google (opcional)
Con `EXPO_PUBLIC_GOOGLE_API_KEY` en `.env` (clave con Places API New y Routes API, sin restricción de sitio web) la búsqueda usa Google y el tiempo de los buses se ajusta al tráfico en vivo. Sin ella usa OpenStreetMap y la hora del día.

## Estructura
- `src/app/` — pantallas (Expo Router): `(tabs)/index` Inicio, `rutas`, `mapa`, `empresas`, `alertas` y `viaje`.
- `src/lib/` — datos de Supabase, planificador (`geo.ts`), búsqueda de lugares y Google.
- `src/components/` — marca, botones, mapa, planificador y escena animada.
- `.env` — `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (claves públicas; la seguridad la dan las políticas RLS de Supabase).

## Comandos
```bash
npx expo start         # servidor de desarrollo
npx tsc --noEmit       # revisar tipos
npx expo-doctor        # diagnóstico de dependencias
```
