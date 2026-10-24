import type { AppointmentStatus } from "@/domain/appointments/change-policy";
import type { BookedSlot, DayHours } from "@/domain/scheduling/availability";

export type Schedule = { hours: DayHours[]; blockedDates: string[] };

export type ServiceInfo = { id: string; duration_minutes: number };

/** Agendamento visto pela cliente (identificado por id + telefone). */
export type ClientAppointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  duration_minutes: number;
};

export type NewBooking = {
  client_name: string;
  client_phone: string;
  client_email: string | null;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
};

/** Porta de persistência dos agendamentos. A implementação real fica em `infrastructure/`. */
export interface BookingGateway {
  findService(id: string): Promise<ServiceInfo | null>;
  loadSchedule(): Promise<Schedule>;
  /** Ocupação ativa (agendado/confirmado) do dia, opcionalmente ignorando um agendamento. */
  listBooked(date: string, excludeId?: string): Promise<BookedSlot[]>;
  /** Criação atômica; deve lançar `AppError("slot_unavailable")` em caso de conflito. */
  create(booking: NewBooking): Promise<void>;
  findForClient(id: string, phone: string): Promise<ClientAppointment | null>;
  setStatus(id: string, status: AppointmentStatus): Promise<void>;
  reschedule(id: string, date: string, time: string): Promise<void>;
}

/** Relógio e fuso do salão, injetados para os testes não dependerem da hora real. */
export interface Clock {
  now(): Date;
  timeZone: string;
}

export interface RateLimiter {
  /** `true` se a chamada pode seguir. */
  allow(key: string, max: number, windowMs: number): boolean;
}
