import { Link } from "@tanstack/react-router";
import { CalendarCheck, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { whatsappDigits } from "@/config/site";
import { Footer } from "./Footer";
import { Header } from "./Header";

/** Barra fixa no celular: o caminho mais curto para agendar ou chamar no WhatsApp. */
function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-border bg-background/97 p-3 backdrop-blur md:hidden">
      <Button asChild size="lg" className="flex-1">
        <Link to="/agendar">
          <CalendarCheck className="h-4 w-4" aria-hidden /> Agendar
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <a
          href={`https://wa.me/${whatsappDigits()}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
        </a>
      </Button>
    </div>
  );
}

type Props = { children: ReactNode; showActionBar?: boolean };

/** Estrutura comum das páginas públicas: cabeçalho, conteúdo e rodapé. */
export function SiteLayout({ children, showActionBar = true }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {showActionBar && <MobileActionBar />}
    </div>
  );
}
