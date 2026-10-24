import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  ChevronDown,
  Clock,
  MapPin,
  MessageCircle,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig, whatsappDigits } from "@/config/site";

const { home } = siteConfig;

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="mb-14 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
      <h2 className="mx-auto mt-4 max-w-2xl font-serif text-3xl font-semibold tracking-tight md:text-5xl">
        {children}
      </h2>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-background to-background">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 md:grid-cols-2 md:py-28">
        <div className="text-center md:text-left">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            {home.heroBadge}
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {home.heroTitleStart}{" "}
            <span className="italic text-primary">{home.heroTitleHighlight}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:mx-0 md:text-lg">
            {home.heroText}
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <Button asChild size="lg" className="w-full rounded-full px-8 sm:w-auto">
              <Link to="/agendar">
                <CalendarCheck className="h-4 w-4" aria-hidden /> Agendar agora
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-full px-8 sm:w-auto"
            >
              <Link to="/sobre">Conhecer o espaço</Link>
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground md:justify-start">
            {["Sem criar conta", "Confirmação na hora", "Remarque quando precisar"].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-5 rounded-[2.75rem] bg-primary/15 blur-3xl" aria-hidden />
          <img
            src={home.heroImage}
            alt={home.heroImageAlt}
            className="relative aspect-[6/7] w-full rounded-[2rem] object-cover shadow-soft-lg"
            width={1200}
            height={1400}
            fetchPriority="high"
          />
          <div className="absolute -bottom-5 left-4 right-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-soft backdrop-blur sm:left-auto sm:right-[-1.5rem] sm:w-64">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Clock className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm leading-snug">
              <strong className="block font-semibold">Agende 24 horas</strong>
              <span className="text-muted-foreground">Veja só os horários livres.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Highlights() {
  if (home.highlights.length === 0) return null;
  return (
    <section className="border-y border-border/60 bg-card px-6 py-10">
      <dl className="mx-auto grid max-w-4xl gap-8 text-center sm:grid-cols-3">
        {home.highlights.map((h) => (
          <div key={h.label} className="flex flex-col">
            <dt className="order-2 mt-1 text-sm text-muted-foreground">{h.label}</dt>
            <dd className="order-1 font-serif text-4xl font-semibold text-primary">{h.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Services() {
  return (
    <section className="px-6 py-20 md:py-28" id="servicos">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="Serviços">
          Feito com carinho, <span className="italic">detalhe por detalhe</span>
        </SectionTitle>
        <div className="grid gap-8 md:grid-cols-3">
          {home.services.map((s) => (
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
              <div className="p-7">
                <h3 className="font-serif text-2xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
                <Link
                  to="/agendar"
                  className="mt-5 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Agendar este serviço →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="bg-cream px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow="Como funciona">Agendar leva menos de um minuto</SectionTitle>
        <ol className="grid gap-6 md:grid-cols-3">
          {home.steps.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-3xl border border-border/60 bg-card p-8 shadow-soft"
            >
              <span className="absolute -top-5 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-lg font-semibold text-primary-foreground shadow-soft">
                {i + 1}
              </span>
              <h3 className="mt-3 font-serif text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Testimonials() {
  if (home.testimonials.length === 0) return null;
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="Depoimentos">Quem já passou por aqui</SectionTitle>
        <div className="grid gap-6 md:grid-cols-3">
          {home.testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-3xl border border-border/60 bg-card p-8 shadow-soft"
            >
              <Quote className="h-6 w-6 text-primary/60" aria-hidden />
              <blockquote className="mt-4 text-sm leading-relaxed">{t.text}</blockquote>
              <figcaption className="mt-5 text-sm font-semibold">{t.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="bg-cream px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="Dúvidas">Perguntas frequentes</SectionTitle>
        <div className="space-y-3">
          {home.faq.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-border/60 bg-card px-6 py-4 shadow-soft"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.question}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VisitUs() {
  const { address, openingHoursText } = siteConfig;
  return (
    <section className="px-6 py-20">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
          <MapPin className="h-6 w-6 text-primary" aria-hidden />
          <h2 className="mt-4 font-serif text-2xl font-semibold">Onde estamos</h2>
          <p className="mt-3 text-muted-foreground">
            {address.line1}
            <br />
            {address.line2}
          </p>
          {address.mapsUrl && (
            <a
              href={address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Ver no mapa →
            </a>
          )}
        </div>
        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
          <Clock className="h-6 w-6 text-primary" aria-hidden />
          <h2 className="mt-4 font-serif text-2xl font-semibold">Horário de atendimento</h2>
          <ul className="mt-3 space-y-1 text-muted-foreground">
            {openingHoursText.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-primary px-8 py-14 text-center text-primary-foreground shadow-soft-lg md:py-20">
        <h2 className="font-serif text-3xl font-semibold md:text-5xl">
          Seu horário está esperando
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
          Escolha o serviço, o dia e o horário que cabem na sua rotina.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="w-full rounded-full px-8 sm:w-auto"
          >
            <Link to="/agendar">Agendar agora</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="w-full rounded-full px-8 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground sm:w-auto"
          >
            <a href={`https://wa.me/${whatsappDigits()}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden /> Falar no WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
