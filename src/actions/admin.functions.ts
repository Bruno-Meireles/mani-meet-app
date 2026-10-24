import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { updateAppointmentSchema } from "@/domain/appointments/schemas";
import type { Appointment, Service } from "@/domain/appointments/schemas";
import { DEFAULT_HOURS } from "@/domain/scheduling/availability";
import { isAdmin, todayInSalonTz } from "./context.server";

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
    ) as unknown as Database["public"]["Tables"]["appointments"]["Update"];

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
const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido");

const saveBusinessHoursSchema = z.object({
  hours: z
    .array(
      z
        .object({
          weekday: z.number().int().min(0).max(6),
          is_open: z.boolean(),
          open_time: timeSchema,
          close_time: timeSchema,
          break_start: timeSchema.nullable(),
          break_end: timeSchema.nullable(),
        })
        .refine(
          (h) => !h.is_open || h.close_time > h.open_time,
          "Fechamento deve ser após a abertura",
        )
        .refine(
          (h) => (h.break_start === null) === (h.break_end === null),
          "Informe início e fim do intervalo",
        )
        .refine(
          (h) => h.break_start === null || (h.break_end as string) > h.break_start,
          "Fim do intervalo deve ser após o início",
        ),
    )
    .length(7),
});

export const saveBusinessHours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => saveBusinessHoursSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("business_hours")
      .upsert(data.hours.map((h) => ({ ...h, updated_at: new Date().toISOString() })));
    if (error) throw new Error(error.message);
    return { success: true };
  });

const blockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(120).optional(),
});

export const addBlockedDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => blockedDateSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("blocked_dates")
      .upsert({ blocked_date: data.date, reason: data.reason || null });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const removeBlockedDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("blocked_dates")
      .delete()
      .eq("blocked_date", data.date);
    if (error) throw new Error(error.message);
    return { success: true };
  });

/** Admin: horários e folgas com motivo (para a tela de configuração). */
export const getScheduleAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const [hours, blocked] = await Promise.all([
      context.supabase.from("business_hours").select("*").order("weekday"),
      context.supabase
        .from("blocked_dates")
        .select("*")
        .gte("blocked_date", todayInSalonTz())
        .order("blocked_date"),
    ]);
    if (hours.error) throw new Error(hours.error.message);
    if (blocked.error) throw new Error(blocked.error.message);
    return {
      hours: hours.data?.length ? hours.data : DEFAULT_HOURS,
      blocked: blocked.data ?? [],
    };
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
/** Resumo do painel: hoje, faturamento estimado do mês, clientes novas e lembretes de amanhã. */
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");

    const today = todayInSalonTz();
    const tomorrow = todayInSalonTz(1);
    const monthStart = `${today.slice(0, 7)}-01`;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [monthRes, clientsRes] = await Promise.all([
      context.supabase
        .from("appointments")
        .select(
          "id, client_name, client_phone, appointment_date, appointment_time, status, reminder_sent_at, services(name, price)",
        )
        .gte("appointment_date", monthStart)
        .neq("status", "cancelled")
        .order("appointment_time", { ascending: true }),
      context.supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
    ]);
    if (monthRes.error) throw new Error(monthRes.error.message);
    if (clientsRes.error) throw new Error(clientsRes.error.message);

    type Row = {
      id: string;
      client_name: string;
      client_phone: string;
      appointment_date: string;
      appointment_time: string;
      status: string;
      reminder_sent_at: string | null;
      services: { name: string; price: number | null } | null;
    };
    const rows = (monthRes.data ?? []) as unknown as Row[];
    const price = (r: Row) => Number(r.services?.price ?? 0);
    const month = rows.filter((r) => r.appointment_date.slice(0, 7) === today.slice(0, 7));

    return {
      todayCount: rows.filter((r) => r.appointment_date === today).length,
      monthRevenue: month.reduce((sum, r) => sum + price(r), 0),
      monthCompletedRevenue: month
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => sum + price(r), 0),
      monthCount: month.length,
      newClients: clientsRes.count ?? 0,
      tomorrow: rows
        .filter((r) => r.appointment_date === tomorrow)
        .map((r) => ({
          id: r.id,
          client_name: r.client_name,
          client_phone: r.client_phone,
          time: r.appointment_time.slice(0, 5),
          service: r.services?.name ?? "",
          reminderSent: !!r.reminder_sent_at,
        })),
    };
  });
