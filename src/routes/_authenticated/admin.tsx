import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, siteConfig } from "@/config/site";
import { AdminShell } from "@/features/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      ...pageMeta("Painel Administrativo", `Gerencie agendamentos do ${siteConfig.name}.`),
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminShell,
});
