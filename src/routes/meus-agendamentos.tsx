import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  getAppointmentsByPhone,
  getAvailableSlots,
  cancelMyAppointment,
  rescheduleMyAppointment,
} from "@/lib/appointments.functions";
import { CLIENT_CHANGE_MIN_HOURS } from "@/lib/appointments.utils";
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

function RescheduleDialog({
  appointment,
  phone,
  onClose,
  onDone,
}: {
  appointment: AppointmentWithService | null;
  phone: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const getSlots = useServerFn(getAvailableSlots);
  const reschedule = useServerFn(rescheduleMyAppointment);
  const dateKey = date ? format(date, "yyyy-MM-dd") : "";

  const { data: slots = [], isFetching } = useQuery({
    queryKey: ["reschedule-slots", dateKey, appointment?.service_id],
    queryFn: () => getSlots({ data: { date: dateKey, serviceId: appointment!.service_id } }),
    enabled: !!appointment && !!dateKey,
  });

  const mutation = useMutation({
    mutationFn: () => reschedule({ data: { id: appointment!.id, phone, date: dateKey, time } }),
    onSuccess: () => {
      toast.success("Agendamento remarcado!");
      setDate(undefined);
      setTime("");
      onDone();
    },
    onError: (error: unknown) => toast.error(resolveErrorMessage(error)),
  });

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reagendar</DialogTitle>
          <DialogDescription>
            {appointment?.services?.name} — escolha uma nova data e horário.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center rounded-2xl border border-border/60 bg-background p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setTime("");
            }}
            disabled={(d) => d < addDays(new Date(), -1)}
            locale={ptBR}
          />
        </div>
        {date && (
          <div>
            {isFetching ? (
              <p className="text-sm text-muted-foreground">Buscando horários...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum horário disponível nessa data.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      time === slot
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <Button disabled={!time || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Remarcando..." : "Confirmar novo horário"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function MyAppointmentsPage() {
  const [phone, setPhone] = useState("");
  const [searchedPhone, setSearchedPhone] = useState("");
  const [appointments, setAppointments] = useState<AppointmentWithService[]>([]);
  const [toCancel, setToCancel] = useState<AppointmentWithService | null>(null);
  const [toReschedule, setToReschedule] = useState<AppointmentWithService | null>(null);
  const getByPhone = useServerFn(getAppointmentsByPhone);
  const cancelFn = useServerFn(cancelMyAppointment);

  // `refresh` reutiliza o telefone já pesquisado (após cancelar/remarcar), sem toast de "vazio".
  const search = async (refresh = false) => {
    try {
      const digits = (refresh ? searchedPhone : phone).replace(/\D/g, "");
      const res = await getByPhone({ data: { phone: digits } });
      setSearchedPhone(digits);
      setAppointments((res ?? []) as AppointmentWithService[]);
      if (!refresh && (res ?? []).length === 0) {
        toast("Nenhum agendamento encontrado para esse número");
      }
    } catch (error: unknown) {
      toast.error(resolveErrorMessage(error));
    }
  };

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id, phone: searchedPhone } }),
    onSuccess: async () => {
      toast.success("Agendamento cancelado");
      setToCancel(null);
      await search(true);
    },
    onError: (error: unknown) => {
      setToCancel(null);
      toast.error(resolveErrorMessage(error));
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
            Meus agendamentos
          </h1>
          <p className="mt-3 text-muted-foreground">
            Consulte, remarque ou cancele seus horários pelo WhatsApp usado no agendamento.
          </p>
        </div>
        <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Digite o WhatsApp usado (ex: 11999998888)"
          />
          <Button className="mt-3 w-full" onClick={() => search()}>
            Buscar
          </Button>

          <div className="mt-6 space-y-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-border/60 bg-background p-5"
              >
                <div className="font-serif text-lg font-semibold">
                  {appointment.client_name} — {appointment.services?.name ?? ""}
                </div>
                <div>
                  {format(new Date(`${appointment.appointment_date}T12:00:00`), "dd/MM/yyyy")} —{" "}
                  {appointment.appointment_time.slice(0, 5)}
                </div>
                {appointment.notes && (
                  <div className="text-sm text-muted-foreground">
                    Observações: {appointment.notes}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setToReschedule(appointment)}>
                    Reagendar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setToCancel(appointment)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ))}
            {appointments.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Alterações online são aceitas até {CLIENT_CHANGE_MIN_HOURS}h antes do horário.
              </p>
            )}
          </div>
        </div>
      </main>

      <RescheduleDialog
        appointment={toReschedule}
        phone={searchedPhone}
        onClose={() => setToReschedule(null)}
        onDone={() => {
          setToReschedule(null);
          void search(true);
        }}
      />

      <AlertDialog open={!!toCancel} onOpenChange={(open) => !open && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel &&
                `${toCancel.services?.name ?? ""} em ${format(new Date(`${toCancel.appointment_date}T12:00:00`), "dd/MM/yyyy")} às ${toCancel.appointment_time.slice(0, 5)}. O horário ficará livre para outras clientes.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (toCancel) cancelMutation.mutate(toCancel.id);
              }}
            >
              Cancelar agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const Route = createFileRoute("/meus-agendamentos")({
  head: () => ({
    meta: [
      { title: "Meus agendamentos — Nail Studio" },
      {
        name: "description",
        content: "Consulte, remarque ou cancele seus agendamentos pelo número de WhatsApp usado",
      },
    ],
  }),
  component: MyAppointmentsPage,
});
