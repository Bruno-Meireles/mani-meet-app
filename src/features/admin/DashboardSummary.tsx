import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/actions/admin.functions";
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
      <div className="mb-10 border-y border-border py-5">
        <p className="font-semibold">Não foi possível carregar o resumo.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Erro desconhecido"}
        </p>
      </div>
    );
  }
  if (!data) return null;

  const stats = [
    { label: "Hoje", value: String(data.todayCount), hint: "agendamentos" },
    {
      label: "Faturamento do mês",
      value: formatCurrency(data.monthRevenue),
      hint: `estimado · ${formatCurrency(data.monthCompletedRevenue)} concluído`,
    },
    { label: "Clientes novas", value: String(data.newClients), hint: "nos últimos 30 dias" },
  ];

  return (
    <div className="mb-12 space-y-10">
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
        {stats.map(({ label, value, hint }) => (
          <div key={label} className="border-t border-foreground pt-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-serif text-5xl leading-[1.15]">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="font-serif text-[28px] leading-[1.15] sm:text-4xl">Lembretes para amanhã</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          Envie uma mensagem de confirmação pelo WhatsApp para reduzir faltas.
        </p>
        <div className="border-t border-foreground">
          {data.tomorrow.length === 0 && (
            <p className="border-b border-border py-4 text-sm text-muted-foreground">
              Nenhum agendamento para amanhã. Quando houver, eles aparecem aqui com o botão de
              WhatsApp.
            </p>
          )}
          {data.tomorrow.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-serif text-2xl leading-tight">{a.client_name}</p>
                <p className="text-sm text-muted-foreground">
                  <strong className="tabular-nums text-foreground">{a.time}</strong> — {a.service}
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
      </section>
    </div>
  );
}
