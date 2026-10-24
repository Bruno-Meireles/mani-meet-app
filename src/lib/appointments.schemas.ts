import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  duration_minutes: z.number(),
  price: z.number().nullable(),
  display_order: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Service = z.infer<typeof serviceSchema>;

export const appointmentStatusSchema = z.enum(["scheduled", "confirmed", "completed", "cancelled"]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  client_name: z.string(),
  client_phone: z.string(),
  client_email: z.string().email().nullable().optional(),
  service_id: z.string().uuid(),
  appointment_date: z.string(), // ISO date YYYY-MM-DD
  appointment_time: z.string(), // HH:MM
  status: appointmentStatusSchema,
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

export const createAppointmentSchema = z.object({
  client_name: z.string().min(2, "Informe o nome"),
  client_phone: z.string().min(8, "Informe um telefone válido"),
  client_email: z.string().email("Informe um email válido").optional().or(z.literal("")),
  service_id: z.string().uuid("Escolha um serviço"),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data"),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, "Escolha um horário"),
  notes: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  id: z.string().uuid(),
  status: appointmentStatusSchema.optional(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
