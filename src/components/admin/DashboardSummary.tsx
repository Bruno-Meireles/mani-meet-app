import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, Wallet, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/server/api";
import { formatCurrency } from "@/shared/format";

function toWhatsappUrl(phone: string, name: string, time: string, service: string) {
  let digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length <= 11) digits = `55${digits}`;
  const msg = `Olá, ${name}! Passando para lembrar do seu horário de ${service} amanhã às ${time}. Podemos confirmar? 💅`;
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(msg)}`;
}

export function DashboardSummary() {
  const getStatsFn = useServerFn(getDashboardStats);
  const { data, error } = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => getStatsFn() });
  if (error) {
    return (
      <div className="mb-10 rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
        <p className="font-medium">Não foi possível carregar o resumo.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Erro desconhecido"}
        </p>
      </div>
    );
  }
  if (!data) return null;

  const stats = [
    { icon: CalendarCheck, label: "Hoje", value: String(data.todayCount), hint: "agendamentos" },
    {
      icon: Wallet,
      label: "Faturamento do mês",
      value: formatCurrency(data.monthRevenue),
      hint: `estimado · ${formatCurrency(data.monthCompletedRevenue)} concluído`,
    },
    {
      icon: UserPlus,
      label: "Clientes novas",
      value: String(data.newClients),
      hint: "nos últimos 30 dias",
    },
  ];

  return (
    <div className="mb-10 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
        {stats.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm">{label}</span>
            </div>
            <p className="mt-4 font-serif text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      {
        <div className="rounded-3xl border border-border/60 bg-cream p-6 shadow-soft">
          <h3 className="font-serif text-xl font-semibold">Lembretes para amanhã</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie uma mensagem de confirmação pelo WhatsApp para reduzir faltas.
          </p>
          <div className="mt-4 space-y-3">
            {data.tomorrow.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
                Nenhum agendamento para amanhã. Quando houver, eles aparecem aqui com o botão de
                WhatsApp.
              </p>
            )}
            {data.tomorrow.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{a.client_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.time} — {a.service}
                    {a.reminderSent && " · lembrete por e-mail enviado"}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a
                    href={toWhatsappUrl(a.client_phone, a.client_name, a.time, a.service)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Lembrar no WhatsApp
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      }
    </div>
  );
}
