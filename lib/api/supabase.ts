import { createClient } from "@supabase/supabase-js";
import { env, requireEnv } from "@/lib/env";

function createSupabaseClient(apiKey: string) {
  return createClient(requireEnv(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"), apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseBrowserClient() {
  return createSupabaseClient(requireEnv(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"));
}

export function createSupabaseServiceClient() {
  return createSupabaseClient(requireEnv(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"));
}