import { Link } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, MessageCircle } from "lucide-react";
import { siteConfig, whatsappDigits } from "@/config/site";

const columnTitle = "mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground";
const itemClass = "inline-flex items-start gap-2 transition-colors hover:text-foreground";

export function Footer() {
  const { name, tagline, contact, address, openingHoursText } = siteConfig;
  return (
    <footer className="border-t border-border bg-cream px-6 pb-28 pt-16 text-sm text-muted-foreground md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-serif text-2xl font-semibold text-foreground">{name}</p>
          <p className="mt-2 leading-relaxed">{tagline}</p>
        </div>

        <div>
          <h2 className={columnTitle}>Contato</h2>
          <ul className="space-y-3">
            <li>
              <a
                href={`https://wa.me/${whatsappDigits()}`}
                target="_blank"
                rel="noopener noreferrer"
                className={itemClass}
              >
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {contact.phoneDisplay}
              </a>
            </li>
            {contact.instagram && (
              <li>
                <a
                  href={`https://instagram.com/${contact.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={itemClass}
                >
                  <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />@
                  {contact.instagram}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className={columnTitle}>Onde e quando</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                {address.line1}
                <br />
                {address.line2}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                {openingHoursText.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </div>

        <nav aria-label="Rodapé">
          <h2 className={columnTitle}>Navegação</h2>
          <ul className="space-y-3">
            <li>
              <Link to="/agendar" className="transition-colors hover:text-foreground">
                Agendar horário
              </Link>
            </li>
            <li>
              <Link to="/meus-agendamentos" className="transition-colors hover:text-foreground">
                Meus agendamentos
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="transition-colors hover:text-foreground">
                Sobre
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="transition-colors hover:text-foreground">
                Política de privacidade
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-border/70 pt-6 text-xs md:flex-row">
        <p>
          © {new Date().getFullYear()} {name}. Todos os direitos reservados.
        </p>
        <Link to="/login" className="opacity-60 transition-opacity hover:opacity-100">
          Área da administradora
        </Link>
      </div>
    </footer>
  );
}
