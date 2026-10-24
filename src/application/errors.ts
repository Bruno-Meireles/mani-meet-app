export type AppErrorCode =
  | "service_not_found"
  | "slot_unavailable"
  | "appointment_not_found"
  | "appointment_not_active"
  | "change_too_late"
  | "rate_limited";

const MESSAGES: Record<AppErrorCode, string> = {
  service_not_found: "Serviço não encontrado",
  slot_unavailable: "Horário não está mais disponível",
  appointment_not_found: "Agendamento não encontrado",
  appointment_not_active: "Este agendamento não pode mais ser alterado",
  change_too_late: "Alterações online só até {hours}h antes do horário. Fale com o studio pelo WhatsApp.",
  rate_limited: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
};

/** Erro de regra de negócio, com mensagem pronta para mostrar à cliente. */
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    vars: Record<string, string | number> = {},
  ) {
    super(
      Object.entries(vars).reduce((msg, [k, v]) => msg.replace(`{${k}}`, String(v)), MESSAGES[code]),
    );
    this.name = "AppError";
  }
}
