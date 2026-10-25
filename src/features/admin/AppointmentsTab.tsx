import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { addWeeks, endOfWeek, format, isSameDay, startOfWeek, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAppointments, updateAppointment, deleteAppointment } from "@/actions/admin.functions";
import type { AppointmentStatus } from "@/domain/appointments/schemas";
import { formatTime } from "@/shared/format";
import { whatsappDigits } from "@/config/site";
import { DashboardSummary } from "./DashboardSummary";

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusStyles: Record<AppointmentStatus, string> = {
  scheduled: "bg-secondary text-secondary-foreground",
  confirmed: "bg-primary/15 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

type Row = {
  id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  services: { name: string } | null;
};

const ISO = "yyyy-MM-dd";

export function AppointmentsTab() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const listFn = useServerFn(listAppointments);
  const updateFn = useServerFn(updateAppointment);
  const deleteFn = useServerFn(deleteAppointment);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["appointments", format(weekStart, ISO), format(weekEnd, ISO)],
    queryFn: () => listFn({ data: { from: format(weekStart, ISO), to: format(weekEnd, ISO) } }),
  });
  const appointments = data as unknown as Row[];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateFn({ data: { id, status } }),
    onSuccess: () => {
      refresh();
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      refresh();
      toast.success("Agendamento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const dayRows = appointments.filter((a) => a.appointment_date === format(selectedDate, ISO));

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  return (
    <>
      <DashboardSummary />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl sm:text-3xl">
          {format(weekStart, "dd")} a {format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarDays className="h-4 w-4" aria-hidden /> Hoje
          </Button>
          <Button
            aria-label="Semana anterior"
            variant="outline"
            size="icon"

            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Próxima semana"
            variant="outline"
            size="icon"

            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando agendamentos...</p>
      ) : error ? (
        <div className="border-y border-border py-6">
          <p className="font-medium">Não foi possível carregar os agendamentos.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta conta não tem permissão de administradora. Saia e entre com a conta autorizada.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-7 border-l border-t border-foreground sm:mb-10">
            {days.map((day) => {
              const iso = format(day, ISO);
              const count = appointments.filter(
                (a) => a.appointment_date === iso && a.status !== "cancelled",
              ).length;
              const selected = isSameDay(day, selectedDate);
              const today = isSameDay(day, new Date());
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  aria-pressed={selected}
                  aria-label={`${format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}, ${count} agendamento${count === 1 ? "" : "s"}`}
                  className={`min-w-0 border-b border-r px-1 py-3 text-center transition-colors sm:py-4 ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : today
                        ? "border-border bg-secondary/60 hover:bg-secondary"
                        : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="block truncate text-[10px] font-medium uppercase opacity-80 sm:text-xs">
                    {format(day, "EEE", { locale: ptBR })}
                  </span>
                  <span className="mt-0.5 block font-serif text-lg sm:text-2xl">
                    {format(day, "dd")}
                  </span>
                  <span
                    className={`mx-auto mt-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold sm:text-xs ${
                      count === 0
                        ? "opacity-0"
                        : selected
                          ? "bg-primary-foreground/25"
                          : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <h3 className="mb-2 font-serif text-[28px] leading-[1.15] first-letter:uppercase sm:text-4xl">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            {dayRows.length === 0 ? (
              <p className="border-t border-foreground pt-4 text-muted-foreground">
                Nenhum agendamento neste dia.
              </p>
            ) : (
              <ul className="border-t border-foreground">
                {dayRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-4 border-b border-border py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="w-16 shrink-0 font-serif text-2xl lining-nums tabular-nums">
                        {formatTime(row.appointment_time)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-serif text-2xl leading-tight">
                          {row.client_name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {row.services?.name ?? "Serviço removido"} · {row.client_phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[row.status]}`}
                      >
                        {statusLabels[row.status]}
                      </span>
                      <Select
                        value={row.status}
                        onValueChange={(value) =>
                          updateStatus.mutate({ id: row.id, status: value as AppointmentStatus })
                        }
                      >
                        <SelectTrigger className="h-9 w-36" aria-label="Alterar status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label={`WhatsApp de ${row.client_name}`}
                      >
                        <a
                          href={`https://wa.me/${whatsappDigits(row.client_phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir agendamento de ${row.client_name}`}
                        onClick={() => {
                          if (window.confirm(`Excluir o agendamento de ${row.client_name}?`)) {
                            remove.mutate(row.id);
                          }
                        }}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}
