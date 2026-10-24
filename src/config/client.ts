import type { ThemeInput } from "./theme";

/**
 * DADOS DO CLIENTE (white-label). Este é o ÚNICO arquivo que muda de um salão para outro:
 * nome, contatos, textos, serviços exibidos na home e identidade visual (`theme`).
 * Passo a passo: docs/INSTALACAO.md. Imagens ficam em `public/images/`.
 */
const theme: ThemeInput = {
  /** rose | lilac | sage | terracotta | ocean. Ajuste fino opcional: hue, chroma, fontHeading, fontBody. */
  preset: "rose",
};

export const siteConfig = {
  /** Nome exibido no cabeçalho, rodapé, título das páginas e e-mails. */
  name: "Nail Studio",
  /** Frase curta usada no título da home e nas redes sociais. */
  tagline: "Manicure e Nail Art",
  /** Descrição padrão para SEO (até ~155 caracteres). */
  description:
    "Agende seu horário de manicure, esmaltação em gel, alongamento e nail art com praticidade.",
  /** URL pública do site (sem barra final). Usada em sitemap e Open Graph. */
  url: "https://mani-meet-app-three.vercel.app",
  locale: "pt-BR",
  /** Fuso do salão (IANA). */
  timezone: "America/Sao_Paulo",
  theme,
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
    heroImage: "/images/hero.svg",
    heroImageAlt: "Mãos com esmaltação em tons de rosa e detalhes dourados",
    /**
     * Números de destaque, só com dados REAIS do salão. Lista vazia oculta a faixa.
     * Exemplo: { value: "+500", label: "clientes atendidas" }
     */
    highlights: [] as { value: string; label: string }[],
    services: [
      {
        title: "Esmaltação em gel",
        description: "Cor intensa, brilho espelhado e até 3 semanas de durabilidade.",
        image: "/images/service-gel.svg",
        alt: "Unhas com esmaltação em gel rosa",
      },
      {
        title: "Alongamento",
        description: "Formatos elegantes e naturais, com acabamento leve e resistente.",
        image: "/images/service-alongamento.svg",
        alt: "Unhas alongadas em formato amendoado nude",
      },
      {
        title: "Nail art",
        description: "Detalhes artesanais e acabamentos exclusivos para a sua personalidade.",
        image: "/images/service-nailart.svg",
        alt: "Unhas com nail art e detalhes dourados",
      },
    ],
    steps: [
      { title: "Escolha o serviço", text: "Veja as opções, a duração e o valor de cada uma." },
      { title: "Marque dia e horário", text: "Só aparecem os horários realmente livres." },
      {
        title: "Receba a confirmação",
        text: "Adicione ao calendário e fale pelo WhatsApp se precisar.",
      },
    ],
    /**
     * Depoimentos, só com avaliações REAIS (com autorização). Lista vazia oculta a seção.
     * Exemplo: { name: "Maria S.", text: "Adorei o resultado!" }
     */
    testimonials: [] as { name: string; text: string }[],
    faq: [
      {
        question: "Posso remarcar ou cancelar?",
        answer:
          "Sim. Em “Meus agendamentos” você remarca ou cancela com pelo menos 12 horas de antecedência. Depois disso, fale com a gente pelo WhatsApp.",
      },
      {
        question: "Preciso criar conta para agendar?",
        answer: "Não. Basta informar nome e telefone na hora de escolher o horário.",
      },
      {
        question: "Quanto tempo dura cada atendimento?",
        answer: "A duração aparece junto de cada serviço na hora de agendar.",
      },
    ],
  },
  about: {
    paragraphs: [
      "Cada atendimento é pensado para oferecer uma experiência relaxante e resultados impecáveis. Trabalhamos com técnicas modernas, produtos de qualidade e muita atenção aos detalhes.",
      "Nossa manicure é especialista em esmaltação em gel, alongamentos, manutenções e nail art. Aqui você encontra um ambiente acolhedor para cuidar de si.",
    ],
  },
} as const;
