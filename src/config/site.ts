/**
 * Configuração do salão (white-label).
 *
 * Para instalar o sistema em um novo cliente, edite apenas este arquivo
 * (e as cores em `src/styles.css`, bloco `:root`). Veja docs/INSTALACAO.md.
 */
export const siteConfig = {
  /** Nome exibido no cabeçalho, rodapé, título das páginas e e-mails. */
  name: "Nail Studio",
  /** Frase curta usada no título da home e nas redes sociais. */
  tagline: "Manicure e Nail Art",
  /** Descrição padrão para SEO (até ~155 caracteres). */
  description:
    "Agende seu horário de manicure, esmaltação em gel, alongamento e nail art com praticidade.",
  /** URL pública do site (sem barra final). Usada em sitemap e Open Graph. */
  url: "https://mani-meet-app.vercel.app",
  locale: "pt-BR",
  /** Fuso do salão (IANA). */
  timezone: "America/Sao_Paulo",
  contact: {
    /** Telefone para exibição. */
    phoneDisplay: "(11) 99999-9999",
    /** WhatsApp só com dígitos, com DDD (o +55 é adicionado automaticamente). */
    whatsapp: "11989433006",
    email: "",
    instagram: "nailstudio",
  },
  address: {
    line1: "Rua das Flores, 123 — Centro",
    line2: "Cidade, Estado",
    /** Link do Google Maps (opcional). */
    mapsUrl: "",
  },
  /** Horário exibido ao público (texto livre, uma linha por item). */
  openingHoursText: ["Segunda a sexta: 9h às 19h", "Sábado: 9h às 14h"],
  home: {
    heroBadge: "Agendamento online",
    heroTitleStart: "Cuidado e beleza para",
    heroTitleHighlight: "suas unhas",
    heroText:
      "Agende seu horário de manicure, esmaltação em gel, alongamento e nail art com praticidade e segurança.",
  },
  about: {
    paragraphs: [
      "Cada atendimento é pensado para oferecer uma experiência relaxante e resultados impecáveis. Trabalhamos com técnicas modernas, produtos de qualidade e muita atenção aos detalhes.",
      "Nossa manicure é especialista em esmaltação em gel, alongamentos, manutenções e nail art. Aqui você encontra um ambiente acolhedor para cuidar de si.",
    ],
  },
} as const;

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
