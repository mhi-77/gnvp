import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase singleton para toda la aplicación GINOVA.
 * Las variables de entorno se leen desde .env (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { realtime: { params: { eventsPerSecond: 10 } } }
);
