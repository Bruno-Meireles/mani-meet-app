import { format } from "date-fns";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getAppointmentsByPhone } from "@/lib/appointments.functions";
import type { Appointment } from "@/lib/appointments.schemas";

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message?: unknown };
    if (typeof message === "string") {
      return message;
    }
  }

  return "Erro ao buscar agendamentos";
};

type AppointmentWithService = Appointment & {
  services?: { name?: string | null } | null;
};

function MyAppointmentsPage() {
  const [phone, setPhone] = useState("");
  const [appointments, setAppointments] = useState<AppointmentWithService[]>([]);
  const getByPhone = useServerFn(getAppointmentsByPhone);

  const search = async () => {
    try {
      const digits = phone.replace(/\D/g, "");
      const res = await getByPhone({ data: { phone: digits } });
      setAppointments(res ?? []);
      if ((res ?? []).length === 0) {
        toast("Nenhum agendamento encontrado para esse número");
      }
    } catch (error: unknown) {
      toast.error(resolveErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">Meus agendamentos</h1>
          <p className="mt-3 text-muted-foreground">Consulte seus horários pelo WhatsApp usado no agendamento.</p>
        </div>
        <div className="mx-auto max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Digite o WhatsApp usado (ex: 11999998888)"
          />
          <Button className="mt-3 w-full" onClick={search}>
            Buscar
          </Button>

          <div className="mt-6 space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-border/60 bg-background p-5">
                <div className="font-serif text-lg font-semibold">
                  {appointment.client_name} — {appointment.services?.name ?? ""}
                </div>
                <div>
                  {format(new Date(`${appointment.appointment_date}T12:00:00`), "dd/MM/yyyy")} — {appointment.appointment_time}
                </div>
                {appointment.notes && (
                  <div className="text-sm text-muted-foreground">Observações: {appointment.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/meus-agendamentos")({
  head: () => ({
    meta: [
      { title: "Meus agendamentos — Nail Studio" },
      { name: "description", content: "Consulte seus agendamentos pelo número de WhatsApp usado" },
    ],
  }),
  component: MyAppointmentsPage,
});
