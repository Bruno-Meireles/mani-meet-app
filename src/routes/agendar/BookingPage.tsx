import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAppointmentSchema, type CreateAppointmentInput } from "@/lib/appointments.schemas";
import { listServices, getAvailableSlots, createAppointment, getProfile } from "@/lib/appointments.functions";
import { formatCurrency, generateAllSlots } from "@/lib/appointments.utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

function BookingPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedService, setSelectedService] = useState<string>("");
  const [confirmed, setConfirmed] = useState<{
    clientName: string;
    serviceName: string;
    dateLabel: string;
    time: string;
  } | null>(null);
  const listServicesFn = useServerFn(listServices);
  const getSlotsFn = useServerFn(getAvailableSlots);
  const createAppointmentFn = useServerFn(createAppointment);
  const getProfileFn = useServerFn(getProfile);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => listServicesFn(),
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["slots", selectedDate?.toISOString().slice(0, 10), selectedService],
    queryFn: () =>
      getSlotsFn({
        data: {
          date: selectedDate!.toISOString().slice(0, 10),
          serviceId: selectedService,
        },
      }),
    enabled: !!selectedDate && !!selectedService,
  });

  const selectedServiceData = services.find((s) => s.id === selectedService);
  const allSlots = selectedDate && selectedService ? generateAllSlots(selectedDate.toISOString().slice(0,10), selectedServiceData?.duration_minutes ?? 30) : [];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      client_name: "",
      client_phone: "",
      client_email: "",
      service_id: "",
      appointment_date: "",
      appointment_time: "",
      notes: "",
    },
  });

  const appointmentDate = watch("appointment_date");
  const appointmentTime = watch("appointment_time");

  // If the selected appointment_time becomes unavailable (e.g. another user booked it), clear it and notify
  useEffect(() => {
    if (appointmentTime && slots && !slots.includes(appointmentTime)) {
      setValue("appointment_time", "");
      toast.error("Horário não disponível");
    }
  }, [slots, appointmentTime, setValue]);

  const mutation = useMutation({
    mutationFn: (data: CreateAppointmentInput) => createAppointmentFn({ data }),
    onSuccess: (_result, data) => {
      const serviceName = services.find((s) => s.id === data.service_id)?.name ?? "";
      const dateLabel = format(new Date(`${data.appointment_date}T12:00:00`), "dd/MM/yyyy");
      // Show confirmation card with filled data (do not auto-open WhatsApp)
      setConfirmed({
        clientName: data.client_name,
        serviceName,
        dateLabel,
        time: data.appointment_time,
      });
      toast.success("Agendamento realizado com sucesso!");
      reset();
      setSelectedDate(undefined);
      setSelectedService("");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      // Do not auto-open WhatsApp. The confirmation button handles opening via user gesture.
    },
    onError: (error: Error) => {
      const msg = (error && (error as any).message) || "Erro ao criar agendamento";
      toast.error(msg);
      // If the error indicates the slot is no longer available, refresh slots and clear selection
      if (typeof msg === 'string' && msg.includes('Horário não disponível')) {
        const dateKey = appointmentDate || (selectedDate ? selectedDate.toISOString().slice(0,10) : undefined);
        // Invalidate and refetch the exact slots query so UI updates immediately
        if (dateKey && selectedService) {
          queryClient.invalidateQueries({ queryKey: ['slots', dateKey, selectedService] });
          queryClient.refetchQueries({ queryKey: ['slots', dateKey, selectedService], exact: true });
        } else {
          queryClient.invalidateQueries({ queryKey: ['slots'] });
          queryClient.refetchQueries({ queryKey: ['slots'], exact: true });
        }
        setValue('appointment_time', '');
      }
    },

  });

  const canSubmit = !!appointmentTime && slots.includes(appointmentTime);

  const onSubmit = (data: CreateAppointmentInput) => {
    if (!canSubmit) {
      toast.error("Escolha um horário disponível antes de confirmar.");
      return;
    }
    mutation.mutate(data);
  };

  const fallbackPhone = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_WHATSAPP_NUMBER) ? (import.meta as any).env.VITE_WHATSAPP_NUMBER : (process.env.VITE_WHATSAPP_NUMBER || '11989433006');
  const salonPhoneSource = profile?.phone ?? fallbackPhone ?? "";
  const salonPhoneDigitsRaw = salonPhoneSource.replace(/\D/g, "");
  let salonPhoneDigits = salonPhoneDigitsRaw.replace(/^0+/, "");
  // If the number doesn't include country code, assume Brazil (+55)
  if (salonPhoneDigits && !salonPhoneDigits.startsWith("55")) {
    if (salonPhoneDigits.length <= 11) salonPhoneDigits = `55${salonPhoneDigits}`;
  }

  // Use api.whatsapp.com/send which works on desktop and mobile
  const whatsappUrl =
    confirmed && salonPhoneDigits
      ? `https://api.whatsapp.com/send?phone=${salonPhoneDigits}&text=${encodeURIComponent(
          `Olá! Acabei de agendar no site:\n\nNome: ${confirmed.clientName}\nServiço: ${confirmed.serviceName}\nData: ${confirmed.dateLabel}\nHorário: ${confirmed.time}`,
        )}`
      : null;


  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const iso = format(date, "yyyy-MM-dd");
      setValue("appointment_date", iso);
      setValue("appointment_time", "");
    } else {
      setValue("appointment_date", "");
      setValue("appointment_time", "");
    }
  };

  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    setValue("service_id", value);
    setValue("appointment_time", "");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 py-12">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Agende seu horário
            </h1>
            <p className="mt-3 text-muted-foreground">
              Preencha seus dados e escolha o serviço, dia e horário.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nome completo</Label>
                <Input id="client_name" placeholder="Seu nome" {...register("client_name")} />
                {errors.client_name && (
                  <p className="text-xs text-destructive">{errors.client_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone / WhatsApp</Label>
                <Input id="client_phone" placeholder="(11) 99999-9999" {...register("client_phone")} />
                {errors.client_phone && (
                  <p className="text-xs text-destructive">{errors.client_phone.message}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="client_email">Email (opcional)</Label>
                <Input id="client_email" placeholder="seu@email.com" {...register("client_email")} />
                {errors.client_email && (
                  <p className="text-xs text-destructive">{errors.client_email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={selectedService} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} — {formatCurrency(service.price)} / {service.duration_minutes}min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("service_id")} />
              {errors.service_id && (
                <p className="text-xs text-destructive">{errors.service_id.message}</p>
              )}
              {selectedServiceData && (
                <p className="text-sm text-muted-foreground">
                  {selectedServiceData.description}
                </p>
              )}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Data</Label>
                <div className="flex justify-center rounded-xl border border-border p-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < addDays(new Date(), -1)}
                    locale={ptBR}
                  />
                </div>
                {appointmentDate && (
                  <p className="text-center text-sm text-muted-foreground">
                    {format(selectedDate!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
                {errors.appointment_date && (
                  <p className="text-xs text-destructive">{errors.appointment_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Horário</Label>
                {selectedDate && selectedService ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {allSlots.map((slot) => {
                        const isAvailable = slots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => isAvailable && setValue("appointment_time", slot)}
                            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                              appointmentTime === slot
                                ? "border-primary bg-primary text-primary-foreground"
                                : isAvailable
                                  ? "border-border bg-background hover:bg-accent"
                                  : "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                            }`}
                            disabled={!isAvailable}
                            title={isAvailable ? "Selecionar horário" : "Horário não disponível"}
                            aria-disabled={!isAvailable}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    {slots.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum horário disponível para essa data.</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Selecione um serviço e uma data para ver os horários.
                  </p>
                )}
                {errors.appointment_time && (
                  <p className="text-xs text-destructive">{errors.appointment_time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Input id="notes" placeholder="Alguma preferência ou informação extra" {...register("notes")} />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full"
              size="lg"
              disabled={isSubmitting || mutation.isPending || !canSubmit}
            >
              {mutation.isPending ? "Confirmando..." : "Confirmar agendamento"}
            </Button>
            {(!canSubmit || !appointmentTime) && (
              <p className="text-sm text-muted-foreground mt-2">Escolha um horário disponível antes de confirmar.</p>
            )}
          </form>

          {confirmed && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center shadow-sm md:p-8">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                Agendamento confirmado!
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {confirmed.clientName}, seu horário de {confirmed.serviceName} ficou para {" "}
                {confirmed.dateLabel} às {confirmed.time}.
              </p>
              {whatsappUrl && (
                <button
                  onClick={() => {
                    const win = window.open(whatsappUrl, "_blank");
                    if (!win) {
                      toast.error("Não foi possível abrir o WhatsApp. Tente novamente.");
                    } else {
                      try { win.focus(); } catch (e) {}
                    }
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Enviar confirmação pelo WhatsApp
                </button>
              )}

              <Button variant="ghost" size="sm" onClick={() => { setConfirmed(null); }}>
                  Fazer novo agendamento
                </Button>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Nail Studio. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default BookingPage;
