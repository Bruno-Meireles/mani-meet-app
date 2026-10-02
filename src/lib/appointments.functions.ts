import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
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
  .validator((input: { date: string; serviceId: string }) => input)
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

export const getAppointmentsByPhone = createServerFn({ method: "GET" })
  .validator((input: { phone: string }) => input)
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const phoneDigits = String(data.phone || "").replace(/\D/g, "");
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*, services(name)")
      .eq("client_phone", phoneDigits)
      .in("status", ["scheduled", "confirmed"])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) throw new Error(error.message);
    return (appointments ?? []) as Appointment[];
  });

export const createAppointment = createServerFn({ method: "POST" })
  .validator((input: unknown) => createAppointmentSchema.parse(input))
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

    const insertPayload = {
      client_name: data.client_name,
      client_phone: data.client_phone,
      client_email: data.client_email || null,
      service_id: data.service_id,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      notes: data.notes || null,
    };

    // Use a server-side, atomic RPC to create the appointment while preventing
    // overlapping bookings. Import the admin client dynamically so this file
    // remains safe to bundle to the client.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: rpcResult, error: rpcError } = await (supabaseAdmin as any).rpc<any>(
        "create_appointment_locked",
        {
          p_client_name: insertPayload.client_name,
          p_client_phone: insertPayload.client_phone,
          p_client_email: insertPayload.client_email,
          p_service_id: insertPayload.service_id,
          p_appointment_date: insertPayload.appointment_date,
          p_appointment_time: insertPayload.appointment_time,
          p_notes: insertPayload.notes,
        },
      );

      if (rpcError) {
        // The RPC raises an exception on conflict which surfaces here.
        throw new Error(rpcError.message || "Horário não disponível");
      }

      // Optionally upsert the client record using the admin client to ensure
      // permissions do not block the operation.
      await supabaseAdmin.from("clients").upsert(
        {
          name: insertPayload.client_name,
          phone: insertPayload.client_phone,
          email: insertPayload.client_email || null,
        },
        { onConflict: "phone", ignoreDuplicates: true },
      );

      return { success: true };
    } catch (e: any) {
      // Re-throw known errors so the caller shows a friendly message
      if (e && e.message) throw new Error(e.message);
      throw e;
    }

  });

export const listAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: { from: string; to: string }) => input)
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
  .validator((input: unknown) => updateAppointmentSchema.parse(input))
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
  .validator((input: { id: string }) => input)
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

// ---------- Clients ----------

const upsertClientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Informe o nome"),
  phone: z.string().min(8, "Informe um telefone válido"),
  email: z.string().email("Informe um email válido").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => upsertClientSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      notes: data.notes || null,
    };

    if (data.id) {
      const { error } = await context.supabase.from("clients").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      // Use upsert by phone to avoid duplicate-key errors when an admin creates
      // a client that already exists by phone. This mirrors the behavior used
      // elsewhere (createAppointment upsert).
      const { data: upserted, error } = await context.supabase
        .from("clients")
        .upsert(payload, { onConflict: "phone" });
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { error } = await context.supabase.from("clients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------- Services (admin) ----------

const upsertServiceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Informe o nome do serviço"),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(10, "Duração mínima de 10 minutos"),
  price: z.number().min(0).nullable().optional(),
  is_active: z.boolean(),
});

export const listAllServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Service[];
  });

export const upsertService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => upsertServiceSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const payload = {
      name: data.name,
      description: data.description || null,
      duration_minutes: data.duration_minutes,
      price: data.price ?? null,
      is_active: data.is_active,
    };
    const query = data.id
      ? context.supabase.from("services").update(payload).eq("id", data.id)
      : context.supabase.from("services").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { error } = await context.supabase.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
