import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, startOfDay } from "date-fns";
import { getSchedule } from "@/lib/appointments.functions";
import { DEFAULT_HOURS, isDayBookable } from "@/lib/availability";

/** Horários de funcionamento e folgas, com função para desabilitar dias no calendário. */
export function useSchedule() {
  const getScheduleFn = useServerFn(getSchedule);
  const { data } = useQuery({
    queryKey: ["schedule"],
    queryFn: () => getScheduleFn(),
    staleTime: 60_000,
  });
  const hours = data?.hours ?? DEFAULT_HOURS;
  const blockedDates = data?.blockedDates ?? [];

  /** Use em `<Calendar disabled={...} />`: passado, dias fechados e folgas. */
  const isDateDisabled = (date: Date) =>
    date < startOfDay(new Date()) ||
    !isDayBookable(format(date, "yyyy-MM-dd"), hours, blockedDates);

  return { hours, blockedDates, isDateDisabled };
}
