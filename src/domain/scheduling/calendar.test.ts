import { describe, expect, it } from "vitest";
import { buildIcs, zonedToUtc } from "./calendar";

describe("zonedToUtc", () => {
  it("converte horário de Brasília (UTC-3) para UTC", () => {
    expect(zonedToUtc("2026-10-26", "10:00", "America/Sao_Paulo").toISOString()).toBe(
      "2026-10-26T13:00:00.000Z",
    );
  });
});

describe("buildIcs", () => {
  const ics = buildIcs({
    uid: "abc@mani",
    title: "Gel, Nail Studio",
    date: "2026-10-26",
    time: "10:00",
    durationMinutes: 90,
    timeZone: "America/Sao_Paulo",
    location: "Rua A, 1",
  });

  it("tem início e fim em UTC corretos", () => {
    expect(ics).toContain("DTSTART:20261026T130000Z");
    expect(ics).toContain("DTEND:20261026T143000Z");
  });

  it("escapa vírgulas e usa CRLF", () => {
    expect(ics).toContain("SUMMARY:Gel\\, Nail Studio");
    expect(ics).toContain("\r\n");
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
  });
});
