import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { AppError } from "@/application/errors";
import type { BookingGateway, ClientAppointment, NewBooking, Schedule } from "@/application/ports";
import { DEFAULT_HOURS, type BookedSlot, type DayHours } from "@/domain/scheduling/availability";
import type { AppointmentStatus } from "@/domain/appointments/change-policy";

type Db = SupabaseClient<Database>;

const ACTIVE = ["scheduled", "confirmed"] as const;

/** Duração vem da relação `services(...)`; o PostgREST pode devolver objeto ou lista de um item. */
function durationOf(services: unknown): number {
  const one = Array.isArray(services) ? services[0] : services;
  return (one as { duration_minutes: number } | null)?.duration_minutes ?? 0;
}

/** Horários de funcionamento e folgas; usa o padrão se o salão ainda não configurou. */
export async function loadScheduleFrom(db: Db): Promise<Schedule> {
  const [hoursRes, blockedRes] = await Promise.all([
    db.from("business_hours").select("*"),
    db.from("blocked_dates").select("blocked_date"),
  ]);
  if (hoursRes.error) console.error("business_hours:", hoursRes.error.message);
  if (blockedRes.error) console.error("blocked_dates:", blockedRes.error.message);
  const hours: DayHours[] = hoursRes.data?.length ? hoursRes.data : DEFAULT_HOURS;
  return { hours, blockedDates: (blockedRes.data ?? []).map((b) => b.blocked_date) };
}

export function createSupabaseBookingGateway(db: Db): BookingGateway {
  return {
    async findService(id) {
      const { data } = await db
        .from("services")
        .select("id, duration_minutes")
        .eq("id", id)
        .maybeSingle();
      return data ?? null;
    },

    loadSchedule: () => loadScheduleFrom(db),

    async listBooked(date, excludeId): Promise<BookedSlot[]> {
      let query = db
        .from("appointments")
        .select("appointment_time, services(duration_minutes)")
        .eq("appointment_date", date)
        .in("status", [...ACTIVE]);
      if (excludeId) query = query.neq("id", excludeId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map((b) => ({
        appointment_time: b.appointment_time,
        duration_minutes: durationOf(b.services),
      }));
    },

    async create(booking: NewBooking) {
      // Reserva atômica no banco (sem horários duplicados), mesmo com pedidos simultâneos.
      const rpc = db.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message?: string } | null }>;
      const { error } = await rpc.call(db, "create_appointment_locked", {
        p_client_name: booking.client_name,
        p_client_phone: booking.client_phone,
        p_client_email: booking.client_email,
        p_service_id: booking.service_id,
        p_appointment_date: booking.appointment_date,
        p_appointment_time: booking.appointment_time,
        p_notes: booking.notes,
      });
      if (error) throw new AppError("slot_unavailable");

      await db
        .from("clients")
        .upsert(
          { name: booking.client_name, phone: booking.client_phone, email: booking.client_email },
          { onConflict: "phone", ignoreDuplicates: true },
        );
    },

    async findForClient(id, phone): Promise<ClientAppointment | null> {
      const { data, error } = await db
        .from("appointments")
        .select("id, appointment_date, appointment_time, status, services(duration_minutes)")
        .eq("id", id)
        .eq("client_phone", phone)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return {
        id: data.id,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        status: data.status as AppointmentStatus,
        duration_minutes: durationOf(data.services),
      };
    },

    async setStatus(id, status) {
      const { error } = await db.from("appointments").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },

    async reschedule(id, date, time) {
      const { error } = await db
        .from("appointments")
        .update({
          appointment_date: date,
          appointment_time: time,
          status: "scheduled",
          reminder_sent_at: null,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}
