import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "./appointments.schemas";
import { generateTimeSlots } from "./appointments.utils";
import type { Service, Appointment } from "./appointments.schemas";

function createPublicClient() {
  const url = process.env['SUPABASE_URL']!;
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

async function isAdmin(supabase: ReturnType<typeof createPublicClient>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
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

export const getAvailableSlots = createServerFn({ method: "GET" })
  .inputValidator((input: { date: string; serviceId: string }) => input)
  .handler(async ({ data }) => {
    const supabase = createPublicClient();

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", data.serviceId)
      .single();

    if (serviceError || !service) throw new Error("Serviço não encontrado");

    const { data: booked, error: bookedError } = await supabase
      .from("appointments")
      .select("appointment_time, services(duration_minutes)")
      .eq("appointment_date", data.date)
      .in("status", ["scheduled", "confirmed"]);

    if (bookedError) throw new Error(bookedError.message);

    const bookedSlots = (booked ?? []).map((b) => ({
      appointment_time: b.appointment_time,
      duration_minutes: (b.services as unknown as { duration_minutes: number }).duration_minutes,
    }));

    const slots = generateTimeSlots(data.date, service.duration_minutes, bookedSlots);

    return slots;
  });

export const createAppointment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createAppointmentSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", data.service_id)
      .single();

    if (serviceError || !service) throw new Error("Serviço não encontrado");

    const { data: booked, error: bookedError } = await supabase
      .from("appointments")
      .select("appointment_time, services(duration_minutes)")
      .eq("appointment_date", data.appointment_date)
      .in("status", ["scheduled", "confirmed"]);

    if (bookedError) throw new Error(bookedError.message);

    const bookedSlots = (booked ?? []).map((b) => ({
      appointment_time: b.appointment_time,
      duration_minutes: (b.services as unknown as { duration_minutes: number }).duration_minutes,
    }));

    const slots = generateTimeSlots(data.appointment_date, service.duration_minutes, bookedSlots);

    if (!slots.includes(data.appointment_time)) {
      throw new Error("Horário não está mais disponível");
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_email: data.client_email || null,
        service_id: data.service_id,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return appointment as Appointment;
  });

export const listAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { from: string; to: string }) => input)
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) {
      throw new Error("Forbidden");
    }

    const { data: appointments, error } = await context.supabase
      .from("appointments")
      .select("*, services(name, duration_minutes, price)")
      .gte("appointment_date", data.from)
      .lte("appointment_date", data.to)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) throw new Error(error.message);
    return (appointments ?? []) as Appointment[];
  });

export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) {
      throw new Error("Forbidden");
    }

    const { id, ...updates } = data;
    const updateData = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    ) as unknown as Database['public']['Tables']['appointments']['Update'];

    const { data: appointment, error } = await context.supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return appointment as Appointment;
  });

export const deleteAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) {
      throw new Error("Forbidden");
    }

    const { error } = await context.supabase.from("appointments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("profiles").select("*").limit(1).single();
  if (error) return null;
  return data;
});
