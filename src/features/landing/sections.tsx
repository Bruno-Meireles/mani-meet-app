import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";
import { listServices } from "@/actions/public.functions";
import { Button } from "@/components/ui/button";
import { siteConfig, whatsappDigits } from "@/config/site";
import { formatCurrency } from "@/shared/format";

const { home } = siteConfig;

const eyebrow = "text-xs font-semibold uppercase tracking-[0.2em] text-primary md:text-[13px]";

function SectionTitle({
  eyebrow: label,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3.5 md:mb-12">
      <p className={eyebrow}>{label}</p>
      <h2 className="max-w-2xl font-serif text-[34px] leading-[1.15] md:text-5xl">{children}</h2>
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-end gap-10 px-5 pb-10 pt-9 md:grid-cols-[7fr_5fr] md:gap-16 md:px-6 md:pb-24 md:pt-20">
      <div className="flex flex-col gap-5 md:gap-7">
        <p className={eyebrow}>{home.heroBadge}</p>
        <h1 className="font-serif text-[42px] leading-[1.1] tracking-[-0.015em] md:text-[76px] md:leading-[1.05] md:tracking-[-0.02em]">
          {home.heroTitleStart} <em className="text-primary">{home.heroTitleHighlight}</em>
        </h1>
        <p className="max-w-[520px] text-base leading-relaxed text-muted-foreground md:text-[19px]">
          {home.heroText}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link to="/agendar">Agendar agora</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/sobre">Conhecer o espaço</Link>
          </Button>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {["Sem criar conta", "Confirmação na hora", "Remarque quando precisar"].map((t) => (
            <li key={t} className="before:mr-2 before:text-primary before:content-['✓']">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <img
        src={home.heroImage}
        alt={home.heroImageAlt}
        className="aspect-[4/5] w-full object-cover"
        width={1200}
        height={1400}
        fetchPriority="high"
      />
    </section>
  );
}

export function Highlights() {
  if (home.highlights.length === 0) return null;
  return (
    <section className="border-y border-border px-5 py-10 md:px-6">
      <dl className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
        {home.highlights.map((h) => (
          <div key={h.label} className="flex flex-col border-t border-foreground pt-4">
            <dt className="order-2 mt-1 text-sm text-muted-foreground">{h.label}</dt>
            <dd className="order-1 font-serif text-5xl leading-none">{h.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type MenuItem = { key: string; name: string; description: string | null; meta: string | null };

const formatDuration = (minutes: number) => {
  if (minutes <= 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h}h${String(m).padStart(2, "0")}`;
};

export function Services() {
  const listServicesFn = useServerFn(listServices);
  const { data } = useQuery({ queryKey: ["services"], queryFn: () => listServicesFn() });

  // O catálogo real (com preço e duração) manda; os textos do site entram enquanto ele não chega.
  const items: (MenuItem & { price: string | null; id: string | null })[] =
    data && data.length > 0
      ? data.map((s) => ({
          key: s.id,
          id: s.id,
          name: s.name,
          description: s.description,
          meta: formatDuration(s.duration_minutes),
          price: s.price === null ? null : formatCurrency(s.price),
        }))
      : home.services.map((s) => ({
          key: s.title,
          id: null,
          name: s.title,
          description: s.description,
          meta: null,
          price: null,
        }));

  return (
    <section className="border-t border-border px-5 py-14 md:px-6 md:py-24" id="servicos">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[4fr_8fr] md:gap-16">
        <div className="flex flex-col gap-3.5">
          <p className={eyebrow}>Serviços &amp; preços</p>
          <h2 className="font-serif text-[34px] leading-[1.15] md:text-5xl">O cardápio</h2>
          <p className="hidden max-w-[300px] leading-relaxed text-muted-foreground md:block">
            Preço e duração à vista. Clique em um serviço para ir direto aos horários.
          </p>
        </div>
        <div>
          {items.map((s, i) => (
            <Link
              key={s.key}
              to="/agendar"
              className="group grid grid-cols-[1fr_auto] items-baseline gap-x-5 gap-y-1 border-b border-border py-5 first:border-t first:border-foreground md:grid-cols-[48px_1fr_auto_140px] md:py-6"
            >
              <span className="hidden text-[13px] font-semibold tabular-nums text-muted-foreground md:block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-serif text-2xl leading-tight md:text-[30px]">{s.name}</span>
                {s.description && (
                  <span className="text-sm text-muted-foreground md:text-[15px]">
                    {s.description}
                  </span>
                )}
              </span>
              {s.meta || s.price ? (
                <span className="text-right text-sm text-muted-foreground md:text-[15px]">
                  {s.meta}
                  <br />
                  {s.price && (
                    <strong className="text-base text-foreground md:text-xl">{s.price}</strong>
                  )}
                </span>
              ) : (
                <span />
              )}
              <span className="hidden items-center gap-1.5 justify-self-end text-[15px] font-semibold text-primary md:flex">
                Ver horários
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="bg-cream px-5 py-14 md:px-6 md:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:gap-12">
        <h2 className="font-serif text-[34px] leading-[1.15] md:text-5xl">
          Três toques <em>e pronto</em>
        </h2>
        <ol className="grid gap-6 md:grid-cols-3 md:gap-12">
          {home.steps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 md:flex-col md:gap-3 md:border-t md:border-foreground md:pt-5"
            >
              <span
                className="w-11 shrink-0 font-serif text-[40px] leading-none text-primary md:w-auto md:text-5xl"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex flex-col gap-0.5 md:gap-2">
                <h3 className="font-sans text-[17px] font-semibold md:text-xl">{step.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground md:text-base">
                  {step.text}
                </p>
              </span>
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
    <section className="px-5 py-14 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="Depoimentos">Quem já passou por aqui</SectionTitle>
        <div className="grid gap-8 md:grid-cols-3">
          {home.testimonials.map((t) => (
            <figure key={t.name} className="border-t border-foreground pt-5">
              <blockquote className="font-serif text-xl leading-snug">“{t.text}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-muted-foreground">
                {t.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="px-5 py-14 md:px-6 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 font-serif text-[30px] leading-[1.15] md:text-5xl">Dúvidas</h2>
        <div>
          {home.faq.map((item) => (
            <details key={item.question} className="group border-t border-border last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold md:py-5 md:text-[19px]">
                {item.question}
                <span
                  className="text-xl leading-none text-primary group-open:hidden md:text-2xl"
                  aria-hidden
                >
                  +
                </span>
                <span
                  className="hidden text-xl leading-none text-primary group-open:inline md:text-2xl"
                  aria-hidden
                >
                  –
                </span>
              </summary>
              <p className="max-w-[600px] pb-5 text-[15px] leading-relaxed text-muted-foreground md:text-base">
                {item.answer}
              </p>
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
    <section className="px-5 pb-14 md:px-6 md:pb-20">
      <div className="mx-auto grid max-w-6xl gap-8 border-t border-foreground pt-8 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl">Onde estamos</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
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
        <div>
          <h2 className="font-serif text-2xl md:text-3xl">Horário de atendimento</h2>
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
    <section className="px-5 pb-16 md:px-6 md:pb-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 rounded-sm bg-primary p-7 text-primary-foreground md:p-14">
        <h2 className="max-w-2xl font-serif text-[34px] leading-[1.15] md:text-5xl">
          Seu horário <em>está esperando</em>.
        </h2>
        <p className="max-w-xl text-primary-foreground/90">
          Escolha o serviço, o dia e o horário que cabem na sua rotina.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/agendar"
            className="flex h-[52px] items-center justify-center rounded-md bg-primary-foreground px-8 text-base font-semibold text-primary"
          >
            Agendar agora
          </Link>
          <a
            href={`https://wa.me/${whatsappDigits()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[52px] items-center justify-center rounded-md border border-primary-foreground/50 px-8 text-base font-medium"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
