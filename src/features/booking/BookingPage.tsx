import React, { useState, useEffect, useMemo, useRef } from "react";
import { addDays, format, startOfToday } from "date-fns";
import { useSearch } from "@tanstack/react-router";
import { PrototypeSwitcher } from "./PrototypeSwitcher";
import { ptBR } from "date-fns/locale";
import { Check, Clock } from "lucide-react";
import { SiteLayout } from "@/features/site-shell/SiteLayout";
import { siteConfig, whatsappDigits } from "@/config/site";
import { CLIENT_CHANGE_MIN_HOURS } from "@/domain/appointments/change-policy";
import { buildIcs } from "@/domain/scheduling/calendar";
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
import {
  createAppointmentSchema,
  type CreateAppointmentInput,
} from "@/domain/appointments/schemas";
import {
  listServices,
  getAvailableSlots,
  createAppointment,
  getProfile,
} from "@/actions/public.functions";
import { formatCurrency } from "@/shared/format";
import { generateAllSlots } from "@/domain/scheduling/availability";
import { useSchedule } from "@/shared/use-schedule";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

function downloadIcs(c: {
  serviceName: string;
  date: string;
  time: string;
  durationMinutes: number;
}) {
  const ics = buildIcs({
    uid: `${c.date}-${c.time}-${Date.now()}@${new URL(siteConfig.url).hostname}`,
    title: `${c.serviceName} — ${siteConfig.name}`,
    date: c.date,
    time: c.time,
    durationMinutes: c.durationMinutes,
    timeZone: siteConfig.timezone,
    location: `${siteConfig.address.line1}, ${siteConfig.address.line2}`,
  });
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "agendamento.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function BookingPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedService, setSelectedService] = useState<string>("");
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState<{
    clientName: string;
    serviceName: string;
    dateLabel: string;
    time: string;
    notes?: string;
    date: string;
    durationMinutes: number;
  } | null>(null);

  const confirmationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (confirmed) {
      // Scroll confirmation into view so the user doesn't miss the WhatsApp button
      try {
        confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (e) {
        // ignore
      }
    }
  }, [confirmed]);
  const listServicesFn = useServerFn(listServices);
  const getSlotsFn = useServerFn(getAvailableSlots);
  const createAppointmentFn = useServerFn(createAppointment);
  const getProfileFn = useServerFn(getProfile);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
  });

  const { data: servicesData = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => listServicesFn(),
  });
  // PROTOTYPE: dados de exemplo só em dev e só quando o banco não responde
  const services = (
    import.meta.env.DEV && servicesData.length === 0
      ? [
          { id: "d1", name: "Esmaltação em gel", description: "Cores à escolha, dura até 3 semanas.", duration_minutes: 60, price: 90 },
          { id: "d2", name: "Manicure completa", description: "Cutilagem, hidratação e esmaltação.", duration_minutes: 45, price: 45 },
          { id: "d3", name: "Alongamento em gel", description: "Molde F1, com acabamento.", duration_minutes: 120, price: 180 },
        ]
      : servicesData
  ) as typeof servicesData;

  const { hours, isDateDisabled } = useSchedule();
  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

  const { data: slotsData = [] } = useQuery({
    queryKey: ["slots", selectedDateKey, selectedService],
    queryFn: () =>
      getSlotsFn({
        data: {
          date: selectedDateKey!,
          serviceId: selectedService,
        },
      }),
    enabled: !!selectedDateKey && !!selectedService,
  });

  const selectedServiceData = services.find((s) => s.id === selectedService);
  const allSlots =
    selectedDateKey && selectedService
      ? generateAllSlots({
          date: selectedDateKey,
          durationMinutes: selectedServiceData?.duration_minutes ?? 30,
          hours,
        })
      : [];
  const slots =
    import.meta.env.DEV && servicesData.length === 0
      ? allSlots.filter((_, i) => i % 4 !== 1)
      : slotsData;

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
        notes: data.notes || "",
        date: data.appointment_date,
        durationMinutes: services.find((s) => s.id === data.service_id)?.duration_minutes ?? 60,
      });
      toast.success("Agendamento realizado com sucesso!");
      reset();
      setSelectedDate(undefined);
      setSelectedService("");
      setStep(1);
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      // Do not auto-open WhatsApp. The confirmation button handles opening via user gesture.
    },
    onError: (error: Error) => {
      const msg = error?.message || "Erro ao criar agendamento";
      toast.error(msg);
      // If the error indicates the slot is no longer available, refresh slots and clear selection
      if (typeof msg === "string" && msg.includes("Horário não disponível")) {
        const dateKey = appointmentDate || selectedDateKey;
        // Invalidate and refetch the exact slots query so UI updates immediately
        if (dateKey && selectedService) {
          queryClient.invalidateQueries({ queryKey: ["slots", dateKey, selectedService] });
          queryClient.refetchQueries({
            queryKey: ["slots", dateKey, selectedService],
            exact: true,
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ["slots"] });
          queryClient.refetchQueries({ queryKey: ["slots"], exact: true });
        }
        setValue("appointment_time", "");
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

  const salonPhoneDigits = whatsappDigits(profile?.phone);

  // Use api.whatsapp.com/send which works on desktop and mobile
  const whatsappUrl =
    confirmed && salonPhoneDigits
      ? (() => {
          let msg = `Olá! Acabei de agendar no site:\n\nNome: ${confirmed.clientName}\nServiço: ${confirmed.serviceName}\nData: ${confirmed.dateLabel}\nHorário: ${confirmed.time}`;
          if (confirmed.notes) msg += `\nObservações: ${confirmed.notes}`;
          return `https://api.whatsapp.com/send?phone=${salonPhoneDigits}&text=${encodeURIComponent(msg)}`;
        })()
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

  const chosenService = services.find((x) => x.id === selectedService);
  // PROTOTYPE (throwaway): três variações da tela, trocadas por ?variant=A|B|C. Veja PrototypeSwitcher.
  const search = useSearch({ from: "/agendar" });
  const variant = search.variant ?? "A";
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(startOfToday(), i)), []);

  const formId = "booking-form";
  const stepTitle = "flex items-center gap-3 font-serif text-xl font-semibold";
  const stepBadge =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground";
  const card = "rounded-3xl border border-border/60 bg-card p-6 shadow-soft md:p-8";

  const serviceField = (
    <div>
      <Label htmlFor="service-select" className="sr-only">
        Serviço
      </Label>
      <Select value={selectedService} onValueChange={handleServiceChange}>
        <SelectTrigger id="service-select" className="h-12 rounded-xl text-base">
          <SelectValue placeholder="Selecione um serviço" />
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name} · {service.duration_minutes} min · {formatCurrency(service.price)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {chosenService && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {chosenService.duration_minutes} min
          </span>
          <span className="font-semibold text-foreground">
            {formatCurrency(chosenService.price)}
          </span>
          {chosenService.description && <span>{chosenService.description}</span>}
        </p>
      )}
      {errors.service_id && (
        <p className="mt-3 text-xs text-destructive">{errors.service_id.message}</p>
      )}
    </div>
  );

  const calendarBlock = (
    <div>
      <div className="flex justify-center rounded-2xl border border-border/60 bg-background p-1 sm:p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={isDateDisabled}
          locale={ptBR}
        />
      </div>
      {errors.appointment_date && (
        <p className="mt-2 text-xs text-destructive">{errors.appointment_date.message}</p>
      )}
    </div>
  );

  const slotButtons = (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {allSlots.map((slot) => {
          const isAvailable = slots.includes(slot);
          return (
            <button
              key={slot}
              type="button"
              onClick={() => isAvailable && setValue("appointment_time", slot)}
              className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                appointmentTime === slot
                  ? "border-primary bg-primary text-primary-foreground"
                  : isAvailable
                    ? "border-border bg-background hover:border-primary/50 hover:bg-accent"
                    : "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-50"
              }`}
              disabled={!isAvailable}
              aria-pressed={appointmentTime === slot}
              title={isAvailable ? "Selecionar horário" : "Horário indisponível"}
            >
              {slot}
            </button>
          );
        })}
      </div>
      {slots.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhum horário livre nesta data. Tente outro dia.
        </p>
      )}
      {errors.appointment_time && (
        <p className="mt-2 text-xs text-destructive">{errors.appointment_time.message}</p>
      )}
    </>
  );

  const slotsBlock =
    selectedDate && selectedService ? (
      <div>
        <p className="mb-3 text-sm font-medium capitalize">
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
        {slotButtons}
      </div>
    ) : (
      <div className="flex h-full min-h-40 items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Escolha um serviço e um dia para ver os horários livres.
      </div>
    );

  const dataFields = (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="client_name">Nome completo</Label>
        <Input
          id="client_name"
          placeholder="Seu nome"
          autoComplete="name"
          {...register("client_name")}
        />
        {errors.client_name && (
          <p className="text-xs text-destructive">{errors.client_name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_phone">Telefone / WhatsApp</Label>
        <Input
          id="client_phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          {...register("client_phone")}
        />
        {errors.client_phone && (
          <p className="text-xs text-destructive">{errors.client_phone.message}</p>
        )}
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="client_email">E-mail (opcional, para receber o lembrete)</Label>
        <Input
          id="client_email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          {...register("client_email")}
        />
        {errors.client_email && (
          <p className="text-xs text-destructive">{errors.client_email.message}</p>
        )}
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Input
          id="notes"
          placeholder="Alguma preferência ou informação extra"
          {...register("notes")}
        />
      </div>
    </div>
  );

  const confirmLabel = mutation.isPending ? "Confirmando..." : "Confirmar agendamento";
  const summaryLine = [
    selectedServiceData?.name,
    selectedDate
      ? `${format(selectedDate, "dd/MM")}${appointmentTime ? ` às ${appointmentTime}` : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const variantA = (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_22rem]">
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <input type="hidden" {...register("service_id")} />
        <section className={card}>
          <h2 className={stepTitle}>
            <span className={stepBadge}>1</span> Escolha o serviço
          </h2>
          <div className="mt-5">{serviceField}</div>
        </section>
        <section className={card}>
          <h2 className={stepTitle}>
            <span className={stepBadge}>2</span> Dia e horário
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {calendarBlock}
            {slotsBlock}
          </div>
        </section>
        <section className={card}>
          <h2 className={stepTitle}>
            <span className={stepBadge}>3</span> Seus dados
          </h2>
          <div className="mt-6">{dataFields}</div>
        </section>
        <div className="lg:hidden">
          <Button
            type="submit"
            className="w-full rounded-full"
            size="lg"
            disabled={isSubmitting || mutation.isPending || !canSubmit}
          >
            {confirmLabel}
          </Button>
          {!canSubmit && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Escolha serviço, dia e horário para confirmar.
            </p>
          )}
        </div>
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
          <h2 className="font-serif text-xl font-semibold">Resumo</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Serviço</dt>
              <dd className="mt-1 font-medium">{selectedServiceData?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Data e hora
              </dt>
              <dd className="mt-1 font-medium">
                {selectedDate
                  ? `${format(selectedDate, "dd/MM/yyyy")}${appointmentTime ? ` às ${appointmentTime}` : ""}`
                  : "—"}
              </dd>
            </div>
            <div className="flex items-end justify-between border-t border-border/60 pt-4">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Duração</dt>
                <dd className="mt-1 font-medium">
                  {selectedServiceData ? `${selectedServiceData.duration_minutes} min` : "—"}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Valor</dt>
                <dd className="mt-1 font-serif text-2xl font-semibold text-primary">
                  {selectedServiceData ? formatCurrency(selectedServiceData.price) : "—"}
                </dd>
              </div>
            </div>
          </dl>
          <Button
            type="submit"
            form={formId}
            className="mt-6 hidden w-full rounded-full lg:inline-flex"
            size="lg"
            disabled={isSubmitting || mutation.isPending || !canSubmit}
          >
            {confirmLabel}
          </Button>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Você pode remarcar ou cancelar em “Meus agendamentos” com até {CLIENT_CHANGE_MIN_HOURS}{" "}
            horas de antecedência.
          </p>
        </div>
      </aside>
    </div>
  );

  const wizardSteps = ["Serviço", "Dia e horário", "Seus dados"];
  const stepReady = [!!selectedService, canSubmit, true];
  const variantB = (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register("service_id")} />
        <ol className="flex items-center gap-2" aria-label="Etapas">
          {wizardSteps.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col gap-2">
              <span
                className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-border"}`}
                aria-hidden
              />
              <span
                className={`text-xs ${i + 1 === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                aria-current={i + 1 === step ? "step" : undefined}
              >
                {i + 1}. {label}
              </span>
            </li>
          ))}
        </ol>

        {summaryLine && (
          <p className="mt-4 rounded-full bg-secondary/70 px-4 py-2 text-center text-xs text-foreground">
            {summaryLine}
            {selectedServiceData ? ` · ${formatCurrency(selectedServiceData.price)}` : ""}
          </p>
        )}

        <div className={`${card} mt-4`}>
          {step === 1 && (
            <>
              <h2 className={stepTitle}>Qual serviço você quer?</h2>
              <div className="mt-5">{serviceField}</div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className={stepTitle}>Quando fica bom pra você?</h2>
              <div className="mt-5 space-y-6">
                {calendarBlock}
                {slotsBlock}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className={stepTitle}>Para quem é o horário?</h2>
              <div className="mt-5">{dataFields}</div>
            </>
          )}
          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button
                type="button"
                className="rounded-full px-8"
                disabled={!stepReady[step - 1]}
                onClick={() => setStep(step + 1)}
              >
                Continuar
              </Button>
            ) : (
              <Button
                type="submit"
                className="rounded-full px-8"
                disabled={isSubmitting || mutation.isPending || !canSubmit}
              >
                {confirmLabel}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );

  const variantC = (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-32">
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register("service_id")} />
        <div className={`${card} space-y-8`}>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Serviço
            </h2>
            {serviceField}
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Dia
            </h2>
            <div
              role="group"
              aria-label="Dia"
              className="-mx-2 flex snap-x gap-2 overflow-x-auto px-2 pb-2"
            >
              {days.map((d) => {
                const disabled = isDateDisabled(d);
                const active = !!selectedDate && format(d, "yyyy-MM-dd") === selectedDateKey;
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    onClick={() => handleDateSelect(d)}
                    className={`flex w-16 shrink-0 snap-start flex-col items-center rounded-2xl border px-2 py-3 transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : disabled
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50"
                          : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <span className="text-[11px] uppercase">
                      {format(d, "EEE", { locale: ptBR })}
                    </span>
                    <span className="font-serif text-2xl font-semibold leading-tight">
                      {format(d, "dd")}
                    </span>
                    <span className="text-[11px] uppercase">
                      {format(d, "MMM", { locale: ptBR })}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.appointment_date && (
              <p className="mt-2 text-xs text-destructive">{errors.appointment_date.message}</p>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Horário
            </h2>
            {selectedDate && selectedService ? (
              slotButtons
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Escolha um serviço e um dia para ver os horários livres.
              </p>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Seus dados
            </h2>
            {dataFields}
          </section>
        </div>
      </form>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm">
            {summaryLine || "Escolha serviço, dia e horário"}
            {selectedServiceData && (
              <span className="ml-2 font-semibold text-primary">
                {formatCurrency(selectedServiceData.price)}
              </span>
            )}
          </p>
          <Button
            type="submit"
            form={formId}
            className="shrink-0 rounded-full px-6"
            disabled={isSubmitting || mutation.isPending || !canSubmit}
          >
            {mutation.isPending ? "Confirmando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <SiteLayout showActionBar={false}>
      <div className="bg-gradient-to-b from-secondary/60 to-background px-6 pb-6 pt-14 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          Agendamento online
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          Agende seu horário
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Escolha o serviço, o dia e o horário. Leva menos de um minuto.
        </p>
      </div>

      {variant === "B" ? variantB : variant === "C" ? variantC : variantA}
      <PrototypeSwitcher
        variants={[
          { key: "A", name: "Cartões + resumo" },
          { key: "B", name: "Passo a passo" },
          { key: "C", name: "Faixa de dias + barra fixa" },
        ]}
        current={variant}
      />

      {confirmed && (
        <div className="mx-auto max-w-3xl px-6 pb-16">
          <div
            ref={confirmationRef}
            id="confirmation-card"
            className="rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-soft-lg md:p-12"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-7 w-7" aria-hidden />
            </span>
            <h2 className="mt-4 font-serif text-2xl font-semibold">Agendamento confirmado!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmed.clientName}, seu horário de {confirmed.serviceName} ficou para{" "}
              {confirmed.dateLabel} às {confirmed.time}.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {whatsappUrl && (
                <Button
                  className="rounded-full"
                  onClick={() => {
                    const win = window.open(whatsappUrl, "_blank");
                    if (!win) {
                      toast.error("Não foi possível abrir o WhatsApp. Tente novamente.");
                    } else {
                      try {
                        win.focus();
                      } catch {
                        // focus pode falhar em alguns navegadores; a janela já foi aberta
                      }
                    }
                  }}
                >
                  Enviar confirmação pelo WhatsApp
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => downloadIcs(confirmed)}
              >
                Adicionar ao calendário
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setConfirmed(null)}>
              Fazer novo agendamento
            </Button>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

export default BookingPage;
