// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

/** 
 * Keep a single client across HMR / re-runs.
 * This prevents multiple GoTrueClient instances in the browser.
 */
declare global {
  // eslint-disable-next-line no-var
  var __SUPABASE_CLIENT__: SupabaseClient | undefined;
}

export const supabase =
  globalThis.__SUPABASE_CLIENT__ ??= createClient(url, anon);
