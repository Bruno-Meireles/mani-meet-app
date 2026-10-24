import { siteConfig } from "./client";

/** Os dados do cliente ficam em `client.ts`; este arquivo só traz funções que os usam. */
export { siteConfig };
export type SiteConfig = typeof siteConfig;

/** Monta o título de uma página: "Página — Nome do salão". */
export function pageTitle(page?: string) {
  return page ? `${page} — ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`;
}

/** Meta tags básicas (SEO + Open Graph + Twitter) de uma página. */
export function pageMeta(page: string | undefined, description: string = siteConfig.description) {
  const title = pageTitle(page);
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: siteConfig.name },
    { property: "og:locale", content: "pt_BR" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}

/** Dígitos do WhatsApp com DDI 55. `VITE_WHATSAPP_NUMBER` tem prioridade se definida. */
export function whatsappDigits(override?: string | null) {
  const raw = (override ||
    import.meta.env["VITE_WHATSAPP_NUMBER"] ||
    siteConfig.contact.whatsapp) as string;
  let digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits && !digits.startsWith("55") && digits.length <= 11) digits = `55${digits}`;
  return digits;
}
