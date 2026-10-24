import { createFileRoute } from "@tanstack/react-router";
import BookingPage from "@/features/booking/BookingPage";
import { pageMeta, siteConfig } from "@/config/site";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: pageMeta("Agendar", `Agende seu horário de manicure no ${siteConfig.name}.`),
  }),
  component: BookingPage,
});
