import { createServerFn } from "@tanstack/react-start";

export const seedAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: user.user!.id, role: "admin" });
    if (roleError) throw new Error(roleError.message);
    return { userId: user.user!.id };
  });
