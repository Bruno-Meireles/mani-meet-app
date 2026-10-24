import { zonedToUtc } from "../scheduling/calendar";

/** Antecedência mínima (em horas) para a cliente cancelar/reagendar sozinha. */
export const CLIENT_CHANGE_MIN_HOURS = 12;

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

export type ChangeCheck = { ok: true } | { ok: false; reason: "not_active" | "too_late" };

type Target = { status: AppointmentStatus; date: string; time: string };

/** A cliente pode alterar este agendamento sozinha? (ativo e com antecedência mínima) */
export function checkClientCanChange(
  target: Target,
  now: Date,
  timeZone: string,
  minHours = CLIENT_CHANGE_MIN_HOURS,
): ChangeCheck {
  if (target.status !== "scheduled" && target.status !== "confirmed") {
    return { ok: false, reason: "not_active" };
  }
  const start = zonedToUtc(target.date, target.time, timeZone);
  const hoursLeft = (start.getTime() - now.getTime()) / 3_600_000;
  return hoursLeft < minHours ? { ok: false, reason: "too_late" } : { ok: true };
}
