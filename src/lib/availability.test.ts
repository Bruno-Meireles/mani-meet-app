import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOURS,
  computeSlots,
  generateAllSlots,
  isDayBookable,
  nowInTimezone,
  weekdayOf,
  type DayHours,
} from "./availability";

// 2026-10-26 é segunda-feira; 2026-10-31 sábado; 2026-11-01 domingo.
const MON = "2026-10-26";
const SAT = "2026-10-31";
const SUN = "2026-11-01";
const longAgo = { date: "2026-01-01", minutes: 0 };

describe("weekdayOf", () => {
  it("retorna 0 para domingo e 1 para segunda", () => {
    expect(weekdayOf(SUN)).toBe(0);
    expect(weekdayOf(MON)).toBe(1);
    expect(weekdayOf(SAT)).toBe(6);
  });
});

describe("computeSlots", () => {
  const base = { hours: DEFAULT_HOURS, blockedDates: [], booked: [], now: longAgo };

  it("gera horários de 30 em 30 dentro do expediente", () => {
    const slots = computeSlots({ ...base, date: MON, durationMinutes: 30 });
    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("18:30");
  });

  it("não oferece horário em que o serviço termina depois do fechamento", () => {
    const slots = computeSlots({ ...base, date: MON, durationMinutes: 90 });
    expect(slots.at(-1)).toBe("17:30");
  });

  it("respeita o horário reduzido de sábado", () => {
    const slots = computeSlots({ ...base, date: SAT, durationMinutes: 60 });
    expect(slots.at(-1)).toBe("13:00");
  });

  it("retorna vazio em dia fechado (domingo)", () => {
    expect(computeSlots({ ...base, date: SUN, durationMinutes: 30 })).toEqual([]);
  });

  it("retorna vazio em data bloqueada (folga)", () => {
    expect(computeSlots({ ...base, date: MON, durationMinutes: 30, blockedDates: [MON] })).toEqual(
      [],
    );
  });

  it("remove horários que conflitam com agendamentos existentes", () => {
    const slots = computeSlots({
      ...base,
      date: MON,
      durationMinutes: 60,
      booked: [{ appointment_time: "10:00:00", duration_minutes: 60 }],
    });
    expect(slots).not.toContain("09:30"); // terminaria 10:30, invadindo o das 10:00
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("09:00");
    expect(slots).toContain("11:00");
  });

  it("respeita o intervalo de almoço", () => {
    const hours: DayHours[] = DEFAULT_HOURS.map((h) =>
      h.weekday === 1 ? { ...h, break_start: "12:00", break_end: "13:00" } : h,
    );
    const slots = computeSlots({ ...base, hours, date: MON, durationMinutes: 60 });
    expect(slots).toContain("11:00");
    expect(slots).not.toContain("11:30");
    expect(slots).not.toContain("12:00");
    expect(slots).not.toContain("12:30");
    expect(slots).toContain("13:00");
  });

  it("hoje: esconde horários que já passaram usando o relógio do salão", () => {
    const slots = computeSlots({
      ...base,
      date: MON,
      durationMinutes: 30,
      now: { date: MON, minutes: 10 * 60 + 15 },
    });
    expect(slots[0]).toBe("10:30");
  });

  it("data no passado não tem horários", () => {
    const slots = computeSlots({
      ...base,
      date: MON,
      durationMinutes: 30,
      now: { date: "2026-10-27", minutes: 0 },
    });
    expect(slots).toEqual([]);
  });

  it("aplica antecedência mínima em minutos", () => {
    const slots = computeSlots({
      ...base,
      date: MON,
      durationMinutes: 30,
      now: { date: MON, minutes: 9 * 60 },
      minLeadMinutes: 60,
    });
    expect(slots[0]).toBe("10:00");
  });
});

describe("generateAllSlots / isDayBookable", () => {
  it("lista todos os horários do dia sem considerar ocupação", () => {
    expect(generateAllSlots({ date: SAT, durationMinutes: 30, hours: DEFAULT_HOURS })).toHaveLength(
      10,
    );
  });

  it("marca domingo e datas bloqueadas como não agendáveis", () => {
    expect(isDayBookable(SUN, DEFAULT_HOURS, [])).toBe(false);
    expect(isDayBookable(MON, DEFAULT_HOURS, [MON])).toBe(false);
    expect(isDayBookable(MON, DEFAULT_HOURS, [])).toBe(true);
  });
});

describe("nowInTimezone", () => {
  it("converte para o fuso do salão (UTC-3 em São Paulo)", () => {
    const utc = new Date("2026-10-26T01:30:00Z"); // 22:30 do dia 25 em Brasília
    expect(nowInTimezone("America/Sao_Paulo", utc)).toEqual({
      date: "2026-10-25",
      minutes: 22 * 60 + 30,
    });
  });
});
