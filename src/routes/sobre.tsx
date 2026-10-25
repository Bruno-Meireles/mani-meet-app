import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/features/site-shell/Header";
import { Footer } from "@/features/site-shell/Footer";
import { MapPin, Clock, Phone, Instagram } from "lucide-react";
import { pageMeta, siteConfig } from "@/config/site";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: pageMeta("Sobre", `Conheça o ${siteConfig.name}, nosso espaço de cuidados com as unhas.`),
  }),
  component: AboutPage,
});

function AboutPage() {
  const { name, about, address, contact, openingHoursText } = siteConfig;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 px-5 py-12 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Sobre o estúdio
            </p>
            <h1 className="font-serif text-[38px] leading-[1.1] text-foreground md:text-[64px]">
              Sobre o {name}
            </h1>
            <p className="mt-4 text-muted-foreground">
              Um espaço dedicado ao cuidado e à beleza das suas unhas.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-6 text-[17px]">
              {about.paragraphs.map((p) => (
                <p key={p} className="leading-relaxed text-foreground">
                  {p}
                </p>
              ))}
            </div>

            <div className="border-t border-foreground pt-6">
              <h2 className="mb-6 font-serif text-2xl">Informações</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                  <span className="text-sm text-muted-foreground">
                    {address.mapsUrl ? (
                      <a
                        href={address.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground"
                      >
                        {address.line1}
                      </a>
                    ) : (
                      address.line1
                    )}
                    <br />
                    {address.line2}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                  <span className="text-sm text-muted-foreground">
                    {openingHoursText.map((line, i) => (
                      <span key={line}>
                        {i > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                  <span className="text-sm text-muted-foreground">{contact.phoneDisplay}</span>
                </li>
                {contact.instagram && (
                  <li className="flex items-start gap-3">
                    <Instagram className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                    <span className="text-sm text-muted-foreground">@{contact.instagram}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
