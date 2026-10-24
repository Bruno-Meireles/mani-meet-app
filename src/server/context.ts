import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Clock, RateLimiter } from "@/application/ports";
import { siteConfig } from "@/config/site";
import { clientIp, rateLimit } from "@/infrastructure/rate-limit";

/** Cliente com a chave pública (anon): só para leituras abertas, como a lista de serviços. */
export function createPublicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/**
 * Cliente com service role, só no servidor. Os dados de agendamentos (nome/telefone das clientes)
 * não são legíveis pelo papel `anon`; toda leitura pública passa por aqui e devolve só o necessário.
 */
export async function getServiceClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const clock: Clock = { now: () => new Date(), timeZone: siteConfig.timezone };

export const limiter: RateLimiter = {
  allow: (key, max, windowMs) => rateLimit(key, max, windowMs),
};

export { clientIp };

/** Data de hoje (YYYY-MM-DD) no fuso do salão, independente do fuso do servidor. */
export function todayInSalonTz(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: siteConfig.timezone }).format(d);
}

export async function isAdmin(supabase: ReturnType<typeof createPublicClient>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}
