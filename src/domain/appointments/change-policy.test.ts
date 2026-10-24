import { describe, expect, it } from "vitest";
import { CLIENT_CHANGE_MIN_HOURS, checkClientCanChange } from "./change-policy";

const TZ = "America/Sao_Paulo";
// 2026-11-10 12:00 em São Paulo (UTC-3) = 15:00 UTC
const now = new Date("2026-11-10T15:00:00Z");

describe("checkClientCanChange", () => {
  it("permite com antecedência suficiente", () => {
    const r = checkClientCanChange({ status: "scheduled", date: "2026-11-11", time: "09:00" }, now, TZ);
    expect(r).toEqual({ ok: true });
  });

  it("permite exatamente no limite de horas", () => {
    // 12:00 + 12h = 00:00 do dia 11
    const r = checkClientCanChange({ status: "confirmed", date: "2026-11-11", time: "00:00" }, now, TZ);
    expect(r.ok).toBe(true);
  });

  it("recusa abaixo do limite de horas", () => {
    const r = checkClientCanChange({ status: "scheduled", date: "2026-11-10", time: "20:00" }, now, TZ);
    expect(r).toEqual({ ok: false, reason: "too_late" });
  });

  it("recusa horário que já passou", () => {
    const r = checkClientCanChange({ status: "scheduled", date: "2026-11-09", time: "10:00" }, now, TZ);
    expect(r).toEqual({ ok: false, reason: "too_late" });
  });

  it.each(["cancelled", "completed"] as const)("recusa status %s", (status) => {
    const r = checkClientCanChange({ status, date: "2026-12-01", time: "10:00" }, now, TZ);
    expect(r).toEqual({ ok: false, reason: "not_active" });
  });

  it("aceita horário com segundos vindo do banco", () => {
    const r = checkClientCanChange({ status: "scheduled", date: "2026-11-12", time: "10:00:00" }, now, TZ);
    expect(r.ok).toBe(true);
  });

  it("usa 12 horas como padrão", () => {
    expect(CLIENT_CHANGE_MIN_HOURS).toBe(12);
  });
});
