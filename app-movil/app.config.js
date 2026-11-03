/**
 * Agrega el mapa de Google para Android solo si hay clave en .env (GOOGLE_MAPS_ANDROID_KEY).
 * En Expo Go no hace falta clave; sí en el APK. La clave debe estar restringida a "Apps para Android"
 * (paquete co.montese.app + huella SHA-1 del certificado de firma) y tener habilitada "Maps SDK for Android".
 */
module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_ANDROID_KEY;
  const plugins = [...(config.plugins ?? [])];
  if (key) plugins.push(["react-native-maps", { androidGoogleMapsApiKey: key }]);
  return { ...config, plugins };
};
