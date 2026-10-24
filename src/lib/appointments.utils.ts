import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Antecedência mínima (em horas) para a cliente cancelar/reagendar sozinha. */
export const CLIENT_CHANGE_MIN_HOURS = 12;

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
