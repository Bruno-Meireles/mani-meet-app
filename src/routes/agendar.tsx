import { createFileRoute } from "@tanstack/react-router";
import BookingPage from "./agendar/BookingPage";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar — Nail Studio" },
      { name: "description", content: "Agende seu horário de manicure no Nail Studio." },
      { property: "og:title", content: "Agendar — Nail Studio" },
      { property: "og:description", content: "Agende seu horário de manicure no Nail Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingPage,
});
