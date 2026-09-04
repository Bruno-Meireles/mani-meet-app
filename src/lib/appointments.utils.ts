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

export function generateTimeSlots(
  date: string,
  durationMinutes: number,
  bookedSlots: { appointment_time: string; duration_minutes: number }[],
): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = BUSINESS_HOURS.start.split(":").map(Number);
  const [endHour, endMinute] = BUSINESS_HOURS.end.split(":").map(Number);

  const start = new Date(`${date}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`);
  const end = new Date(`${date}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`);

  const now = new Date();
  const selectedDate = parseISO(date);
  const isToday = startOfDay(selectedDate).getTime() === startOfDay(now).getTime();

  let current = start;
  while (current < end) {
    const slotEnd = addMinutes(current, durationMinutes);
    const timeStr = format(current, "HH:mm");

    const isPast = isToday && isBefore(addMinutes(current, durationMinutes), now);

    const hasConflict = bookedSlots.some((booked) => {
      const bookedStart = new Date(`${date}T${booked.appointment_time}:00`);
      const bookedEnd = addMinutes(bookedStart, booked.duration_minutes);
      return current < bookedEnd && slotEnd > bookedStart;
    });

    if (!isPast && !hasConflict && slotEnd <= end) {
      slots.push(timeStr);
    }

    current = addMinutes(current, BUSINESS_HOURS.intervalMinutes);
  }

  return slots;
}
