import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAppointments, updateAppointment, deleteAppointment } from "@/lib/appointments.functions";
import { formatDateBR, formatTime } from "@/lib/appointments.utils";
import type { AppointmentStatus } from "@/lib/appointments.schemas";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, LogOut, Trash2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Nail Studio" },
      { name: "description", content: "Gerencie agendamentos do Nail Studio." },
      { property: "og:title", content: "Painel Administrativo — Nail Studio" },
      { property: "og:description", content: "Gerencie agendamentos do Nail Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusVariants: Record<AppointmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  scheduled: "default",
  confirmed: "secondary",
  completed: "outline",
  cancelled: "destructive",
};

function AdminPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const listAppointmentsFn = useServerFn(listAppointments);
  const updateAppointmentFn = useServerFn(updateAppointment);
  const deleteAppointmentFn = useServerFn(deleteAppointment);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", format(weekStart, "yyyy-MM-dd"), format(weekEnd, "yyyy-MM-dd")],
    queryFn: () =>
      listAppointmentsFn({
        data: {
          from: format(weekStart, "yyyy-MM-dd"),
          to: format(weekEnd, "yyyy-MM-dd"),
        },
      }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentFn({ data: { id, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status atualizado");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteAppt = useMutation({
    mutationFn: (id: string) => deleteAppointmentFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento removido");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const selectedAppointments = selectedDate
    ? appointments.filter((a) => a.appointment_date === format(selectedDate, "yyyy-MM-dd"))
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <h1 className="font-serif text-xl font-semibold tracking-tight">Painel administrativo</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold">
              {format(weekStart, "dd")} a {format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Carregando agendamentos...</p>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const iso = format(day, "yyyy-MM-dd");
                  const dayAppointments = appointments.filter((a) => a.appointment_date === iso);
                  const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === iso;
                  return (
                    <button
                      key={iso}
                      onClick={() => setSelectedDate(day)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <p className="mt-1 font-serif text-xl font-semibold">{format(day, "dd")}</p>
                      {dayAppointments.length > 0 && (
                        <Badge variant="secondary" className="mt-2">
                          {dayAppointments.length}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-serif text-xl font-semibold">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  {selectedAppointments.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum agendamento neste dia.</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-medium">{appointment.client_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTime(appointment.appointment_time)} — {" "}
                              {(appointment.services as unknown as { name: string }).name}
                            </p>
                            <p className="text-xs text-muted-foreground">{appointment.client_phone}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={statusVariants[appointment.status as AppointmentStatus]}>
                              {statusLabels[appointment.status as AppointmentStatus]}
                            </Badge>
                            <Select
                              value={appointment.status}
                              onValueChange={(value) =>
                                updateStatus.mutate({ id: appointment.id, status: value as AppointmentStatus })
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue placeholder="Alterar status" />
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
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteAppt.mutate(appointment.id)}
                              disabled={deleteAppt.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
