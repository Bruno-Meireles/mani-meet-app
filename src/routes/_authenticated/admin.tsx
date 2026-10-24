import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { DashboardSummary } from "@/components/admin/DashboardSummary";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/admin/ClientsTab";
import { ServicesTab } from "@/components/admin/ServicesTab";
import {
  listAppointments,
  updateAppointment,
  deleteAppointment,
} from "@/lib/appointments.functions";
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

const statusVariants: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
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

  const {
    data: appointments = [],
    isLoading,
    error,
  } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Status atualizado");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteAppt = useMutation({
    mutationFn: (id: string) => deleteAppointmentFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
        <div className="container mx-auto grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 md:px-6">
          <h1 className="flex min-w-0 items-center gap-2 truncate font-serif text-lg font-semibold tracking-tight sm:text-xl">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate">
              Nail Studio{" "}
              <span className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-primary">
                · Painel
              </span>
            </span>
          </h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0 gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="agenda">
            <TabsList className="mb-8 w-full sm:mb-10 sm:w-auto">
              <TabsTrigger value="agenda" className="flex-1 sm:flex-none">
                Agendamentos
              </TabsTrigger>
              <TabsTrigger value="clientes" className="flex-1 sm:flex-none">
                Clientes
              </TabsTrigger>
              <TabsTrigger value="servicos" className="flex-1 sm:flex-none">
                Serviços
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agenda">
              <DashboardSummary />
              <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:mb-8">
                <h2 className="min-w-0 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
                  {format(weekStart, "dd")} a {format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}
                </h2>
                <div className="flex shrink-0 gap-1.5 sm:gap-2">
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
                <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
                  <p className="font-medium">Não foi possível carregar os agendamentos.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta conta não tem permissão de administradora. Saia e entre com a conta
                    autorizada.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8 grid grid-cols-7 gap-1.5 sm:mb-10 sm:gap-3">
                    {days.map((day) => {
                      const iso = format(day, "yyyy-MM-dd");
                      const dayAppointments = appointments.filter(
                        (a) => a.appointment_date === iso,
                      );
                      const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === iso;
                      return (
                        <Button
                          key={iso}
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedDate(day)}
                          aria-label={`${format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}${dayAppointments.length ? `, ${dayAppointments.length} agendamento${dayAppointments.length > 1 ? "s" : ""}` : ""}`}
                          className={`h-auto min-w-0 flex-col items-stretch gap-0 overflow-hidden px-1 py-2 text-left shadow-none rounded-2xl sm:p-4 ${
                            isSelected
                              ? "border-primary bg-secondary shadow-soft"
                              : "border-border/60 bg-card hover:border-primary/40"
                          }`}
                        >
                          <p className="truncate text-[10px] font-medium uppercase text-muted-foreground sm:text-xs">
                            <span className="sm:hidden">
                              {format(day, "EEEEE", { locale: ptBR })}
                            </span>
                            <span className="hidden sm:inline">
                              {format(day, "EEE", { locale: ptBR })}
                            </span>
                          </p>
                          <p className="mt-0.5 font-serif text-base font-semibold sm:mt-1 sm:text-xl">
                            {format(day, "dd")}
                          </p>
                          {dayAppointments.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="mt-1 h-4 min-w-4 self-start px-1 text-[10px] sm:mt-2 sm:h-auto sm:px-2.5 sm:text-xs"
                            >
                              {dayAppointments.length}
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft sm:p-8">
                      <h3 className="mb-6 font-serif text-xl font-semibold capitalize sm:text-2xl">
                        {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </h3>
                      {selectedAppointments.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum agendamento neste dia.</p>
                      ) : (
                        <div className="space-y-4">
                          {selectedAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background p-5 md:flex-row md:items-center md:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="break-words font-serif text-lg font-semibold">
                                  {appointment.client_name}
                                </p>
                                <p className="break-words text-sm text-muted-foreground">
                                  {formatTime(appointment.appointment_time)} —{" "}
                                  {
                                    (appointment as unknown as { services: { name: string } })
                                      .services.name
                                  }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {appointment.client_phone}
                                </p>
                              </div>
                              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap">
                                <Badge
                                  variant={statusVariants[appointment.status as AppointmentStatus]}
                                >
                                  {statusLabels[appointment.status as AppointmentStatus]}
                                </Badge>
                                <Select
                                  value={appointment.status}
                                  onValueChange={(value) =>
                                    updateStatus.mutate({
                                      id: appointment.id,
                                      status: value as AppointmentStatus,
                                    })
                                  }
                                >
                                  <SelectTrigger className="min-w-0 sm:w-36">
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
                                  aria-label={`Excluir agendamento de ${appointment.client_name}`}
                                  className="shrink-0"
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
            </TabsContent>

            <TabsContent value="clientes">
              <ClientsTab />
            </TabsContent>

            <TabsContent value="servicos">
              <ServicesTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
