/**
 * Limitador simples em memória (janela deslizante) para endpoints públicos.
 * É "melhor esforço": em serverless cada instância tem seu próprio contador, o que já barra
 * abuso básico (scripts em loop). Para proteção forte, ative o rate limit/WAF da Vercel.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Evita crescimento indefinido do mapa.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}

export function resetRateLimits() {
  hits.clear();
}

/** IP do cliente (cabeçalho padrão da Vercel/proxies). Só chamar dentro de uma server function. */
export async function clientIp(): Promise<string> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const forwarded = getRequestHeader("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || getRequestHeader("x-real-ip") || "unknown";
}
