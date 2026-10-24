import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
      <main className="flex-1 px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              Sobre o {name}
            </h1>
            <p className="mt-4 text-muted-foreground">
              Um espaço dedicado ao cuidado e à beleza das suas unhas.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-6">
              {about.paragraphs.map((p) => (
                <p key={p} className="leading-relaxed text-foreground">
                  {p}
                </p>
              ))}
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-10 shadow-soft">
              <h2 className="mb-6 font-serif text-xl font-semibold">Informações</h2>
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
