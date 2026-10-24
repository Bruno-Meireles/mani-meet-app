import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Nail Studio" },
      { name: "description", content: "Acesso administrativo do Nail Studio." },
      { property: "og:title", content: "Login — Nail Studio" },
      { property: "og:description", content: "Acesso administrativo do Nail Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
                placeholder="demo@teste.com"
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
                placeholder="demoteste"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar com email"}
            </Button>
          </form>

          <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/60 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Acesso de demonstração</p>
            <p>Email: demo@teste.com</p>
            <p>Senha: demoteste</p>
          </div>
        </div>
      </main>
      <footer className="border-t border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Nail Studio. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
