import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/features/site-shell/Header";
import { Footer } from "@/features/site-shell/Footer";
import { toast } from "sonner";
import { pageMeta, siteConfig } from "@/config/site";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      ...pageMeta("Login", `Acesso administrativo do ${siteConfig.name}.`),
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) {
        navigate({ to: "/admin" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Erro ao entrar");
      return;
    }
    toast.success("Login realizado!");
    navigate({ to: "/admin" });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Erro ao entrar com Google");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-10 shadow-soft-lg">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-semibold tracking-tight">Login</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre para gerenciar seus agendamentos.
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar com email"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
