import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, ExternalLink, LogOut, Scissors, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { siteConfig } from "@/config/site";
import { AppointmentsTab } from "./AppointmentsTab";
import { ClientsTab } from "./ClientsTab";
import { ScheduleTab } from "./ScheduleTab";
import { ServicesTab } from "./ServicesTab";

const TABS = [
  { value: "agenda", label: "Agenda", icon: CalendarDays, content: <AppointmentsTab /> },
  { value: "clientes", label: "Clientes", icon: Users, content: <ClientsTab /> },
  { value: "servicos", label: "Serviços", icon: Scissors, content: <ServicesTab /> },
  { value: "horarios", label: "Horários", icon: Clock, content: <ScheduleTab /> },
];

/** Casca do painel: cabeçalho com a marca, atalho para o site e abas por área. */
export function AdminShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 px-4 backdrop-blur-md md:px-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 md:h-[84px]">
          <h1 className="flex min-w-0 items-baseline gap-3 truncate font-serif text-[26px] leading-none md:text-[30px]">
            <span className="truncate">{siteConfig.name}</span>
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Painel
            </span>
          </h1>
          <div className="flex shrink-0 items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/" target="_blank">
                <ExternalLink className="h-4 w-4" aria-hidden /> Ver site
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut className="h-4 w-4" aria-hidden /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <Tabs defaultValue="agenda">
            <TabsList className="mb-8 h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-border bg-transparent p-0 sm:mb-10">
              {TABS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="-mb-px gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-[15px] font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Icon className="h-4 w-4" aria-hidden /> {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map(({ value, content }) => (
              <TabsContent key={value} value={value}>
                {content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
