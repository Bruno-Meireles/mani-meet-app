import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Sparkles, Clock, Calendar, Heart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nail Studio — Manicure e Nail Art" },
      { name: "description", content: "Agende seu horário de manicure, esmaltação em gel, alongamento e nail art com praticidade." },
      { property: "og:title", content: "Nail Studio — Manicure e Nail Art" },
      { property: "og:description", content: "Agende seu horário de manicure, esmaltação em gel, alongamento e nail art com praticidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-background to-background px-4 py-20 md:py-32">
          <div className="container mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-sm font-medium text-rose-700">
              <Sparkles className="h-4 w-4" />
              <span>Agendamento online</span>
            </div>
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
              Cuidado e beleza para <br className="hidden md:block" />
              <span className="text-primary">suas unhas</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Agende seu horário de manicure, esmaltação em gel, alongamento e nail art com praticidade e segurança.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/agendar">Agendar agora</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link to="/sobre">Conhecer o studio</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="container mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold">Agendamento fácil</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Escolha o serviço, dia e horário disponíveis em poucos cliques.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold">Horários flexíveis</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Atendimento de segunda a sábado, com horários que cabem na sua rotina.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold">Cuidado especial</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Produtos de qualidade e atenção aos detalhes para unhas saudáveis.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Nail Studio. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
