import { createClient } from "@supabase/supabase-js";

import { env, requireEnv } from "@/lib/env";

export function createServiceSupabaseClient() {
  const supabaseUrl = env.supabaseUrl || requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey =
    env.supabaseServiceRoleKey || requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
