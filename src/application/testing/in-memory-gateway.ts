import { AppError } from "../errors";
import type {
  BookingGateway,
  ClientAppointment,
  NewBooking,
  Schedule,
  ServiceInfo,
} from "../ports";
import { DEFAULT_HOURS, type BookedSlot } from "@/domain/scheduling/availability";
import type { AppointmentStatus } from "@/domain/appointments/change-policy";

type Row = ClientAppointment & { client_phone: string };

/** Implementação em memória da porta, só para os testes. */
export class InMemoryGateway implements BookingGateway {
  services = new Map<string, ServiceInfo>();
  rows: Row[] = [];
  schedule: Schedule = { hours: DEFAULT_HOURS, blockedDates: [] };
  private nextId = 1;

  addService(service: ServiceInfo) {
    this.services.set(service.id, service);
  }

  addAppointment(row: Partial<Row> & { appointment_date: string; appointment_time: string }) {
    const created: Row = {
      id: `appt-${this.nextId++}`,
      status: "scheduled",
      duration_minutes: 60,
      client_phone: "11999990000",
      ...row,
    };
    this.rows.push(created);
    return created;
  }

  async findService(id: string) {
    return this.services.get(id) ?? null;
  }

  async loadSchedule() {
    return this.schedule;
  }

  async listBooked(date: string, excludeId?: string): Promise<BookedSlot[]> {
    return this.rows
      .filter(
        (r) =>
          r.appointment_date === date &&
          r.id !== excludeId &&
          (r.status === "scheduled" || r.status === "confirmed"),
      )
      .map((r) => ({ appointment_time: r.appointment_time, duration_minutes: r.duration_minutes }));
  }

  async create(booking: NewBooking) {
    const service = this.services.get(booking.service_id);
    if (!service) throw new AppError("service_not_found");
    const clash = (await this.listBooked(booking.appointment_date)).some((b) => {
      const [bh = 0, bm = 0] = b.appointment_time.split(":").map(Number);
      const [nh = 0, nm = 0] = booking.appointment_time.split(":").map(Number);
      const bs = bh * 60 + bm;
      const ns = nh * 60 + nm;
      return ns < bs + b.duration_minutes && ns + service.duration_minutes > bs;
    });
    if (clash) throw new AppError("slot_unavailable");
    this.addAppointment({
      appointment_date: booking.appointment_date,
      appointment_time: booking.appointment_time,
      duration_minutes: service.duration_minutes,
      client_phone: booking.client_phone,
    });
  }

  async findForClient(id: string, phone: string) {
    return this.rows.find((r) => r.id === id && r.client_phone === phone) ?? null;
  }

  async setStatus(id: string, status: AppointmentStatus) {
    const row = this.rows.find((r) => r.id === id);
    if (row) row.status = status;
  }

  async reschedule(id: string, date: string, time: string) {
    const row = this.rows.find((r) => r.id === id);
    if (row)
      Object.assign(row, { appointment_date: date, appointment_time: time, status: "scheduled" });
  }
}
