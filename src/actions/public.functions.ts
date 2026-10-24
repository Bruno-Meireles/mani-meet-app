import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  bookAppointment,
  cancelClientAppointment,
  getAvailableSlots as getAvailableSlotsUseCase,
  rescheduleClientAppointment,
} from "@/application/booking";
import { AppError } from "@/application/errors";
import { createAppointmentSchema } from "@/domain/appointments/schemas";
import type { Appointment, Service } from "@/domain/appointments/schemas";
import { createSupabaseBookingGateway, loadScheduleFrom } from "@/infrastructure/supabase-booking-gateway";
import { clientIp, clock, createPublicClient, getServiceClient, limiter, todayInSalonTz } from "./context.server";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function deps() {
  return { gateway: createSupabaseBookingGateway(await getServiceClient()), clock, limiter };
}

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Service[];
});

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient().from("profiles").select("*").limit(1).single();
  return error ? null : data;
});

/** Público: o fluxo de agendamento usa isto para desabilitar dias fechados/bloqueados. */
export const getSchedule = createServerFn({ method: "GET" }).handler(async () =>
  loadScheduleFrom(createPublicClient()),
);

export const getAvailableSlots = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ date: dateSchema, serviceId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => getAvailableSlotsUseCase(data, await deps()));

export const createAppointment = createServerFn({ method: "POST" })
  .validator((input: unknown) => createAppointmentSchema.parse(input))
  .handler(async ({ data }) => {
    await bookAppointment(data, await deps(), await clientIp());
    return { success: true };
  });

export const getAppointmentsByPhone = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ phone: z.string().min(8).max(20) }).parse(input))
  .handler(async ({ data }) => {
    if (!limiter.allow(`lookup:${await clientIp()}`, 20, 10 * 60_000)) throw new AppError("rate_limited");
    const supabase = await getServiceClient();
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        "id, client_name, client_phone, service_id, appointment_date, appointment_time, status, notes, services(name, duration_minutes)",
      )
      .eq("client_phone", data.phone.replace(/\D/g, ""))
      .gte("appointment_date", todayInSalonTz())
      .in("status", ["scheduled", "confirmed"])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });
    if (error) throw new Error(error.message);
    return (appointments ?? []) as unknown as Appointment[];
  });

const clientChangeSchema = z.object({ id: z.string().uuid(), phone: z.string().min(8) });

export const cancelMyAppointment = createServerFn({ method: "POST" })
  .validator((input: unknown) => clientChangeSchema.parse(input))
  .handler(async ({ data }) => {
    await cancelClientAppointment(data, await deps(), await clientIp());
    return { success: true };
  });

export const rescheduleMyAppointment = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    clientChangeSchema
      .extend({ date: dateSchema, time: z.string().regex(/^\d{2}:\d{2}$/) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await rescheduleClientAppointment(data, await deps(), await clientIp());
    return { success: true };
  });
