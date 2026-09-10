import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/seed-admin")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
          email: "admin@nailstudio.local",
          password: "Admin123!",
          email_confirm: true,
        });
        if (error) return new Response(error.message, { status: 500 });
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: user.user!.id, role: "admin" });
        if (roleError) return new Response(roleError.message, { status: 500 });
        return new Response("ok " + user.user!.id, { status: 200 });
      },
    },
  },
});
