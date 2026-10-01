import { format, addMinutes, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const BUSINESS_HOURS = {
  start: "09:00",
  end: "19:00",
  intervalMinutes: 30,
};

export function formatDateBR(dateString: string) {
  return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
}

export function formatTime(timeString: string) {
  return timeString.slice(0, 5);
}

export function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function generateAllSlots(
  date: string,
  durationMinutes: number,
  intervalMinutes: number = BUSINESS_HOURS.intervalMinutes,
): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = BUSINESS_HOURS.start.split(":").map(Number);
  const [endHour, endMinute] = BUSINESS_HOURS.end.split(":").map(Number);

  const start = new Date(`${date}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`);
  const end = new Date(`${date}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`);

  let current = start;
  while (current < end) {
    const timeStr = format(current, "HH:mm");
    slots.push(timeStr);
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
}

export function generateTimeSlots(
  date: string,
  durationMinutes: number,
  bookedSlots: { appointment_time: string; duration_minutes: number }[],
): string[] {
  // Build all candidate slots, then filter out past/conflicting ones.
  const all = generateAllSlots(date, durationMinutes);
  const slots: string[] = [];
  const now = new Date();
  const selectedDate = parseISO(date);
  const isToday = startOfDay(selectedDate).getTime() === startOfDay(now).getTime();

  const [endHour, endMinute] = BUSINESS_HOURS.end.split(":").map(Number);
  const end = new Date(`${date}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`);

  for (const time of all) {
    const current = new Date(`${date}T${time}:00`);
    const slotEnd = addMinutes(current, durationMinutes);

    const isPast = isToday && isBefore(slotEnd, now);

    const hasConflict = bookedSlots.some((booked) => {
      const bookedTime = formatTime(booked.appointment_time);
      const bookedStart = new Date(`${date}T${bookedTime}:00`);
      const bookedEnd = addMinutes(bookedStart, booked.duration_minutes);
      return current < bookedEnd && slotEnd > bookedStart;
    });

    if (!isPast && !hasConflict && slotEnd <= end) {
      slots.push(time);
    }
  }

  return slots;
}
