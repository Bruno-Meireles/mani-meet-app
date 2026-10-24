import { beforeEach, describe, expect, it } from "vitest";
import { AppError } from "./errors";
import { InMemoryGateway } from "./testing/in-memory-gateway";
import {
  bookAppointment,
  cancelClientAppointment,
  getAvailableSlots,
  rescheduleClientAppointment,
} from "./booking";
import type { Clock, RateLimiter } from "./ports";

const SERVICE = { id: "svc-1", duration_minutes: 60 };
const TZ = "America/Sao_Paulo";
// Terça 2026-11-10, 09:00 em São Paulo
const clock: Clock = { now: () => new Date("2026-11-10T12:00:00Z"), timeZone: TZ };
const allow: RateLimiter = { allow: () => true };
const deny: RateLimiter = { allow: () => false };

let gateway: InMemoryGateway;
beforeEach(() => {
  gateway = new InMemoryGateway();
  gateway.addService(SERVICE);
});

const input = (overrides = {}) => ({
  client_name: "Ana",
  client_phone: "(11) 99999-0000",
  client_email: "",
  service_id: SERVICE.id,
  appointment_date: "2026-11-12",
  appointment_time: "10:00",
  notes: "",
  ...overrides,
});

describe("getAvailableSlots", () => {
  it("lista os horários livres do dia", async () => {
    const slots = await getAvailableSlots(
      { date: "2026-11-12", serviceId: "svc-1" },
      { gateway, clock },
    );
    expect(slots[0]).toBe("09:00");
    expect(slots).toContain("18:00");
    expect(slots).not.toContain("18:30");
  });

  it("remove horários ocupados por agendamento ativo", async () => {
    gateway.addAppointment({ appointment_date: "2026-11-12", appointment_time: "10:00" });
    const slots = await getAvailableSlots(
      { date: "2026-11-12", serviceId: "svc-1" },
      { gateway, clock },
    );
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("09:30");
    expect(slots).toContain("11:00");
  });

  it("agendamento cancelado não ocupa horário", async () => {
    gateway.addAppointment({
      appointment_date: "2026-11-12",
      appointment_time: "10:00",
      status: "cancelled",
    });
    const slots = await getAvailableSlots(
      { date: "2026-11-12", serviceId: "svc-1" },
      { gateway, clock },
    );
    expect(slots).toContain("10:00");
  });

  it("dia bloqueado não tem horários", async () => {
    gateway.schedule = { ...gateway.schedule, blockedDates: ["2026-11-12"] };
    expect(
      await getAvailableSlots({ date: "2026-11-12", serviceId: "svc-1" }, { gateway, clock }),
    ).toEqual([]);
  });

  it("serviço inexistente", async () => {
    await expect(
      getAvailableSlots({ date: "2026-11-12", serviceId: "x" }, { gateway, clock }),
    ).rejects.toMatchObject({ code: "service_not_found" });
  });
});

describe("bookAppointment", () => {
  it("cria o agendamento normalizando o telefone", async () => {
    await bookAppointment(input(), { gateway, clock, limiter: allow }, "1.1.1.1");
    expect(gateway.rows).toHaveLength(1);
    expect(gateway.rows[0]?.client_phone).toBe("11999990000");
  });

  it("recusa horário fora do expediente", async () => {
    await expect(
      bookAppointment(
        input({ appointment_time: "21:00" }),
        { gateway, clock, limiter: allow },
        "ip",
      ),
    ).rejects.toMatchObject({ code: "slot_unavailable" });
  });

  it("recusa horário já ocupado", async () => {
    await bookAppointment(input(), { gateway, clock, limiter: allow }, "ip");
    await expect(
      bookAppointment(input(), { gateway, clock, limiter: allow }, "ip"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("respeita o limite de tentativas", async () => {
    await expect(
      bookAppointment(input(), { gateway, clock, limiter: deny }, "ip"),
    ).rejects.toMatchObject({
      code: "rate_limited",
    });
    expect(gateway.rows).toHaveLength(0);
  });
});

describe("cancelClientAppointment", () => {
  it("cancela com antecedência suficiente", async () => {
    const appt = gateway.addAppointment({
      appointment_date: "2026-11-12",
      appointment_time: "10:00",
    });
    await cancelClientAppointment(
      { id: appt.id, phone: "(11) 99999-0000" },
      { gateway, clock, limiter: allow },
      "ip",
    );
    expect(gateway.rows[0]?.status).toBe("cancelled");
  });

  it("não cancela agendamento de outro telefone", async () => {
    const appt = gateway.addAppointment({
      appointment_date: "2026-11-12",
      appointment_time: "10:00",
    });
    await expect(
      cancelClientAppointment(
        { id: appt.id, phone: "11888887777" },
        { gateway, clock, limiter: allow },
        "ip",
      ),
    ).rejects.toMatchObject({ code: "appointment_not_found" });
  });

  it("recusa em cima da hora", async () => {
    const appt = gateway.addAppointment({
      appointment_date: "2026-11-10",
      appointment_time: "15:00",
    });
    await expect(
      cancelClientAppointment(
        { id: appt.id, phone: "11999990000" },
        { gateway, clock, limiter: allow },
        "ip",
      ),
    ).rejects.toMatchObject({ code: "change_too_late" });
  });

  it("recusa agendamento já cancelado", async () => {
    const appt = gateway.addAppointment({
      appointment_date: "2026-11-12",
      appointment_time: "10:00",
      status: "cancelled",
    });
    await expect(
      cancelClientAppointment(
        { id: appt.id, phone: "11999990000" },
        { gateway, clock, limiter: allow },
        "ip",
      ),
    ).rejects.toMatchObject({ code: "appointment_not_active" });
  });
});

describe("rescheduleClientAppointment", () => {
  it("remarca para um horário livre", async () => {
    const appt = gateway.addAppointment({
      appointment_date: "2026-11-12",
      appointment_time: "10:00",
    });
    await rescheduleClientAppointment(
      { id: appt.id, phone: "11999990000", date: "2026-11-13", time: "14:00" },
      { gateway, clock, limiter: allow },
      "ip",
    );
    expect(gateway.rows[0]).toMatchObject({
      appointment_date: "2026-11-13",
      appointment_time: "14:00",
    });
  });

  it("permite remarcar para um horário que sobrepõe o próprio agendamento", async () => {
    const appt = gateway.addAppointment({
      appointment_date: "2026-11-12",
      appointment_time: "10:00",
    });
    await rescheduleClientAppointment(
      { id: appt.id, phone: "11999990000", date: "2026-11-12", time: "10:30" },
      { gateway, clock, limiter: allow },
      "ip",
    );
    expect(gateway.rows[0]?.appointment_time).toBe("10:30");
  });

  it("recusa horário ocupado por outra cliente", async () => {
    const appt = gateway.addAppointment({
      appointment_date: "2026-11-12",
      appointment_time: "10:00",
    });
    gateway.addAppointment({
      appointment_date: "2026-11-13",
      appointment_time: "14:00",
      client_phone: "11777776666",
    });
    await expect(
      rescheduleClientAppointment(
        { id: appt.id, phone: "11999990000", date: "2026-11-13", time: "14:00" },
        { gateway, clock, limiter: allow },
        "ip",
      ),
    ).rejects.toMatchObject({ code: "slot_unavailable" });
  });
});
