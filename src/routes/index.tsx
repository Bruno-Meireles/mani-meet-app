import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sparkles, Clock, Calendar, Heart } from "lucide-react";
import { pageMeta, siteConfig } from "@/config/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: pageMeta(undefined),
  }),
  component: HomePage,
});

const services = [
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
];

const features = [
  {
    icon: Calendar,
    title: "Agendamento fácil",
    text: "Escolha o serviço, dia e horário disponíveis em poucos cliques.",
  },
  {
    icon: Clock,
    title: "Horários flexíveis",
    text: "Atendimento de segunda a sábado, com horários que cabem na sua rotina.",
  },
  {
    icon: Heart,
    title: "Cuidado especial",
    text: "Produtos de qualidade e atenção aos detalhes para unhas saudáveis.",
  },
];

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-background to-background">
          <div className="container mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-32">
            <div className="text-center md:text-left">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-4 w-4" />
                <span>{siteConfig.home.heroBadge}</span>
              </div>
              <h1 className="font-serif text-5xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-7xl">
                {siteConfig.home.heroTitleStart}{" "}
                <span className="italic text-primary">{siteConfig.home.heroTitleHighlight}</span>
              </h1>
              <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:mx-0">
                {siteConfig.home.heroText}
              </p>
              <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row md:justify-start">
                <Button asChild size="lg">
                  <Link to="/agendar">Agendar agora</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/sobre">Conhecer o espaço</Link>
                </Button>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div
                className="absolute -inset-4 rounded-[2.5rem] bg-primary/10 blur-2xl"
                aria-hidden
              />
              <img
                src="/images/hero.svg"
                alt="Mãos com esmaltação em tons de rosa e detalhes dourados"
                className="relative aspect-[6/7] w-full rounded-[2rem] object-cover shadow-soft-lg"
                width={1200}
                height={1400}
              />
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
                Serviços
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
                Feito com carinho, <span className="italic">detalhe por detalhe</span>
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {services.map((s) => (
                <article
                  key={s.title}
                  className="group overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={s.image}
                      alt={s.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-8">
                    <h3 className="font-serif text-2xl font-semibold">{s.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream px-6 py-24">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-border/60 bg-card p-10 text-center shadow-soft"
                >
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
