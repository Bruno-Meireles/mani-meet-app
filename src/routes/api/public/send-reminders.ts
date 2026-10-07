import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Lembrete de véspera por e-mail (Resend). Deve ser chamado 1x/dia por um agendador
 * (ex.: 18h) com `Authorization: Bearer $LOVABLE_CRON_SECRET`.
 *
 * Variáveis: RESEND_API_KEY, REMINDER_FROM_EMAIL (ex.: "Nail Studio <lembretes@seudominio.com>").
 * Agendamentos sem e-mail não são enviados aqui: aparecem no painel com botão de WhatsApp.
 */
export const Route = createFileRoute("/api/public/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        const apiKey = process.env["RESEND_API_KEY"];
        const from = process.env["REMINDER_FROM_EMAIL"];
        if (!apiKey || !from) {
          return Response.json({ error: "RESEND_API_KEY/REMINDER_FROM_EMAIL não configurados" }, { status: 500 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
          new Date(Date.now() + 86_400_000),
        );

        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select("id, client_name, client_email, appointment_time, services(name)")
          .eq("appointment_date", tomorrow)
          .in("status", ["scheduled", "confirmed"])
          .is("reminder_sent_at", null)
          .not("client_email", "is", null);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        let sent = 0;
        const failed: string[] = [];
        for (const a of data ?? []) {
          const service = (a.services as unknown as { name: string } | null)?.name ?? "seu atendimento";
          const time = a.appointment_time.slice(0, 5);
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from,
              to: a.client_email,
              subject: `Lembrete: ${service} amanhã às ${time}`,
              html: `<p>Olá, ${a.client_name}!</p><p>Passando para lembrar do seu horário de <strong>${service}</strong> amanhã, às <strong>${time}</strong>.</p><p>Precisa remarcar ou cancelar? Acesse "Meus agendamentos" no nosso site.</p><p>Até lá! 💅</p>`,
            }),
          });
          if (res.ok) {
            await supabaseAdmin
              .from("appointments")
              .update({ reminder_sent_at: new Date().toISOString() })
              .eq("id", a.id);
            sent++;
          } else {
            failed.push(a.id);
          }
        }
        return Response.json({ date: tomorrow, sent, failed });
      },
    },
  },
});
