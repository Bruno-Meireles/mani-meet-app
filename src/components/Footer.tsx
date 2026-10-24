import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, MessageCircle } from "lucide-react";
import { siteConfig, whatsappDigits } from "@/config/site";

export function Footer() {
  const { name, contact, address } = siteConfig;
  return (
    <footer className="border-t border-border bg-background px-6 py-12 text-sm text-muted-foreground">
      <div className="container mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:justify-between">
        <div className="space-y-2">
          <p className="font-serif text-lg font-semibold text-foreground">{name}</p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              {address.line1}
              <br />
              {address.line2}
            </span>
          </p>
        </div>
        <ul className="space-y-2">
          <li>
            <a
              href={`https://wa.me/${whatsappDigits()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4 text-primary" aria-hidden /> {contact.phoneDisplay}
            </a>
          </li>
          {contact.instagram && (
            <li>
              <a
                href={`https://instagram.com/${contact.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-foreground"
              >
                <Instagram className="h-4 w-4 text-primary" aria-hidden /> @{contact.instagram}
              </a>
            </li>
          )}
        </ul>
        <nav aria-label="Rodapé" className="flex flex-col gap-2">
          <Link to="/sobre" className="hover:text-foreground">
            Sobre
          </Link>
          <Link to="/meus-agendamentos" className="hover:text-foreground">
            Meus agendamentos
          </Link>
          <Link to="/privacidade" className="hover:text-foreground">
            Política de privacidade
          </Link>
        </nav>
      </div>
      <p className="mt-10 text-center">
        © {new Date().getFullYear()} {name}. Todos os direitos reservados.
      </p>
    </footer>
  );
}
