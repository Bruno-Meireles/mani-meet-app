import { createFileRoute } from "@tanstack/react-router";
import MyAppointmentsPage from "./meus-agendamentos";

export const Route = createFileRoute("/meus-agendamentos")({
  head: () => ({
    meta: [
      { title: "Meus agendamentos — Nail Studio" },
      { name: "description", content: "Consulte seus agendamentos pelo número de WhatsApp usado" },
    ],
  }),
  component: MyAppointmentsPage,
});
