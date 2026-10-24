import { CLIENT_CHANGE_MIN_HOURS, checkClientCanChange } from "@/domain/appointments/change-policy";
import { computeSlots, nowInTimezone } from "@/domain/scheduling/availability";
import { AppError } from "./errors";
import type { BookingGateway, Clock, NewBooking, RateLimiter } from "./ports";

type ReadDeps = { gateway: BookingGateway; clock: Clock };
type WriteDeps = ReadDeps & { limiter: RateLimiter };

const WINDOW_MS = 10 * 60_000;
const LIMITS = { book: 6, change: 15 } as const;

const digits = (value: string) => value.replace(/\D/g, "");

function guard(deps: WriteDeps, scope: keyof typeof LIMITS, ip: string) {
  if (!deps.limiter.allow(`${scope}:${ip}`, LIMITS[scope], WINDOW_MS)) {
    throw new AppError("rate_limited");
  }
}

/** Horários livres de um dia para um serviço (considera expediente, folgas e ocupação). */
async function freeSlots(
  deps: ReadDeps,
  date: string,
  durationMinutes: number,
  excludeId?: string,
) {
  const [schedule, booked] = await Promise.all([
    deps.gateway.loadSchedule(),
    deps.gateway.listBooked(date, excludeId),
  ]);
  return computeSlots({
    date,
    durationMinutes,
    hours: schedule.hours,
    blockedDates: schedule.blockedDates,
    booked,
    now: nowInTimezone(deps.clock.timeZone, deps.clock.now()),
  });
}

export async function getAvailableSlots(
  input: { date: string; serviceId: string },
  deps: ReadDeps,
) {
  const service = await deps.gateway.findService(input.serviceId);
  if (!service) throw new AppError("service_not_found");
  return freeSlots(deps, input.date, service.duration_minutes);
}

export type BookingInput = {
  client_name: string;
  client_phone: string;
  client_email?: string | undefined;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string | undefined;
};

export async function bookAppointment(input: BookingInput, deps: WriteDeps, ip: string) {
  guard(deps, "book", ip);
  const service = await deps.gateway.findService(input.service_id);
  if (!service) throw new AppError("service_not_found");

  const slots = await freeSlots(deps, input.appointment_date, service.duration_minutes);
  if (!slots.includes(input.appointment_time)) throw new AppError("slot_unavailable");

  const booking: NewBooking = {
    client_name: input.client_name,
    client_phone: digits(input.client_phone),
    client_email: input.client_email || null,
    service_id: input.service_id,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    notes: input.notes || null,
  };
  await deps.gateway.create(booking);
}

/** Carrega o agendamento da cliente e confere se ela ainda pode alterá-lo. */
async function loadChangeable(input: { id: string; phone: string }, deps: WriteDeps, ip: string) {
  guard(deps, "change", ip);
  const appt = await deps.gateway.findForClient(input.id, digits(input.phone));
  if (!appt) throw new AppError("appointment_not_found");
  const check = checkClientCanChange(
    { status: appt.status, date: appt.appointment_date, time: appt.appointment_time },
    deps.clock.now(),
    deps.clock.timeZone,
  );
  if (!check.ok) {
    throw check.reason === "not_active"
      ? new AppError("appointment_not_active")
      : new AppError("change_too_late", { hours: CLIENT_CHANGE_MIN_HOURS });
  }
  return appt;
}

export async function cancelClientAppointment(
  input: { id: string; phone: string },
  deps: WriteDeps,
  ip: string,
) {
  const appt = await loadChangeable(input, deps, ip);
  await deps.gateway.setStatus(appt.id, "cancelled");
}

export async function rescheduleClientAppointment(
  input: { id: string; phone: string; date: string; time: string },
  deps: WriteDeps,
  ip: string,
) {
  const appt = await loadChangeable(input, deps, ip);
  const slots = await freeSlots(deps, input.date, appt.duration_minutes, appt.id);
  if (!slots.includes(input.time)) throw new AppError("slot_unavailable");
  await deps.gateway.reschedule(appt.id, input.date, input.time);
}
