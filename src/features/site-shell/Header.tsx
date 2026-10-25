import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/meus-agendamentos", label: "Meus agendamentos" },
] as const;

const linkClass =
  "text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground";

function Brand() {
  return (
    <Link
      to="/"
      className="font-serif text-[26px] leading-none text-foreground md:text-[32px]"
      aria-label={`${siteConfig.name} — início`}
    >
      {siteConfig.name}
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 px-5 backdrop-blur-md md:px-6">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between md:h-[84px]">
        <Brand />

        <nav className="hidden items-center gap-10 md:flex" aria-label="Principal">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground" }}
              className={linkClass}
            >
              {item.label}
            </Link>
          ))}
          <Button asChild className="px-6 md:h-[46px] md:text-[15px]">
            <Link to="/agendar">Agendar horário</Link>
          </Button>
        </nav>

        <button
          className="inline-flex h-11 w-11 items-center justify-center md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-background px-5 py-3 md:hidden"
          aria-label="Menu móvel"
        >
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="w-full" size="lg">
              <Link to="/agendar" onClick={() => setOpen(false)}>
                Agendar horário
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
