/**
 * Cálculo de disponibilidade (funções puras, sem I/O).
 * Tudo é feito em "minutos desde meia-noite" no fuso do salão, independente do fuso do servidor.
 */

export type DayHours = {
  /** 0 = domingo … 6 = sábado */
  weekday: number;
  is_open: boolean;
  /** "HH:MM" ou "HH:MM:SS" */
  open_time: string;
  close_time: string;
  break_start: string | null;
  break_end: string | null;
};

export type BookedSlot = { appointment_time: string; duration_minutes: number };

export const SLOT_INTERVAL_MINUTES = 30;

/** Padrão usado enquanto o salão não configurou horários no painel. */
export const DEFAULT_HOURS: DayHours[] = [
  {
    weekday: 0,
    is_open: false,
    open_time: "09:00",
    close_time: "19:00",
    break_start: null,
    break_end: null,
  },
  ...[1, 2, 3, 4, 5].map((weekday) => ({
    weekday,
    is_open: true,
    open_time: "09:00",
    close_time: "19:00",
    break_start: null,
    break_end: null,
  })),
  {
    weekday: 6,
    is_open: true,
    open_time: "09:00",
    close_time: "14:00",
    break_start: null,
    break_end: null,
  },
];

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function toMinutes(time: string): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Dia da semana (0 = domingo) de uma data "YYYY-MM-DD", sem depender do fuso da máquina. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Data e minutos atuais no fuso informado. */
export function nowInTimezone(timeZone: string, now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function hoursFor(date: string, hours: DayHours[]): DayHours | undefined {
  return hours.find((h) => h.weekday === weekdayOf(date));
}

/** O dia pode receber agendamentos (aberto e não bloqueado)? */
export function isDayBookable(date: string, hours: DayHours[], blockedDates: string[]): boolean {
  if (blockedDates.includes(date)) return false;
  return hoursFor(date, hours)?.is_open ?? false;
}

type AllSlotsInput = {
  date: string;
  durationMinutes: number;
  hours: DayHours[];
  intervalMinutes?: number;
};

/** Todos os horários possíveis do dia (expediente + almoço), sem considerar ocupação ou "agora". */
export function generateAllSlots({
  date,
  durationMinutes,
  hours,
  intervalMinutes = SLOT_INTERVAL_MINUTES,
}: AllSlotsInput): string[] {
  const day = hoursFor(date, hours);
  if (!day?.is_open) return [];

  const open = toMinutes(day.open_time);
  const close = toMinutes(day.close_time);
  const breakStart = day.break_start ? toMinutes(day.break_start) : null;
  const breakEnd = day.break_end ? toMinutes(day.break_end) : null;

  const slots: string[] = [];
  for (let start = open; start + durationMinutes <= close; start += intervalMinutes) {
    const end = start + durationMinutes;
    const overlapsBreak =
      breakStart !== null && breakEnd !== null && start < breakEnd && end > breakStart;
    if (!overlapsBreak) slots.push(minutesToTime(start));
  }
  return slots;
}

type ComputeSlotsInput = AllSlotsInput & {
  blockedDates: string[];
  booked: BookedSlot[];
  /** Relógio do salão (veja `nowInTimezone`). */
  now: { date: string; minutes: number };
  /** Antecedência mínima para agendar no mesmo dia. */
  minLeadMinutes?: number;
};

/** Horários realmente disponíveis para reservar. */
export function computeSlots(input: ComputeSlotsInput): string[] {
  const { date, durationMinutes, hours, blockedDates, booked, now, minLeadMinutes = 0 } = input;
  if (!isDayBookable(date, hours, blockedDates)) return [];
  if (date < now.date) return [];

  const busy = booked.map((b) => {
    const start = toMinutes(b.appointment_time);
    return { start, end: start + b.duration_minutes };
  });

  return generateAllSlots(input).filter((time) => {
    const start = toMinutes(time);
    const end = start + durationMinutes;
    if (date === now.date && start < now.minutes + minLeadMinutes) return false;
    return !busy.some((b) => start < b.end && end > b.start);
  });
}
