import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

// Lectura pública con la clave anónima (las políticas RLS limitan qué se puede leer).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
