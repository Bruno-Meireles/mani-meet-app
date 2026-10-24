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
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label={`${siteConfig.name} — início`}>
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-lg font-semibold text-primary-foreground shadow-soft"
        aria-hidden
      >
        {siteConfig.name.charAt(0)}
      </span>
      <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
        {siteConfig.name}
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 py-3 md:px-6">
        <Brand />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
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
          <Button asChild size="sm" className="rounded-full px-6">
            <Link to="/agendar">Agendar horário</Link>
          </Button>
        </nav>

        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-border/50 bg-background px-5 py-5 md:hidden"
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
            <Button asChild className="w-full rounded-full" size="lg">
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
