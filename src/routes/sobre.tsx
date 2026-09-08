import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { MapPin, Clock, Phone, Instagram } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Nail Studio" },
      { name: "description", content: "Conheça o Nail Studio, nosso espaço de manicure e cuidados com as unhas." },
      { property: "og:title", content: "Sobre — Nail Studio" },
      { property: "og:description", content: "Conheça o Nail Studio, nosso espaço de manicure e cuidados com as unhas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              Sobre o studio
            </h1>
            <p className="mt-4 text-muted-foreground">
              Um espaço dedicado ao cuidado e à beleza das suas unhas.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <p className="leading-relaxed text-foreground">
                No Nail Studio, cada atendimento é pensado para oferecer uma experiência relaxante e resultados impecáveis. Trabalhamos com técnicas modernas, produtos de qualidade e muita atenção aos detalhes.
              </p>
              <p className="leading-relaxed text-foreground">
                Nossa manicure é especialista em esmaltação em gel, alongamentos, manutenções e nail art. Aqui você encontra um ambiente acolhedor para cuidar de si.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-6 font-serif text-xl font-semibold">Informações</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Rua das Flores, 123 — Centro
                    <br />
                    Cidade, Estado
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Segunda a sexta: 9h às 19h
                    <br />
                    Sábado: 9h às 14h
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">(11) 99999-9999</span>
                </li>
                <li className="flex items-start gap-3">
                  <Instagram className="mt-0.5 h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">@nailstudio</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Nail Studio. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
