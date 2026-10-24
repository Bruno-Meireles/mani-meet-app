import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/features/site-shell/Header";
import { Footer } from "@/features/site-shell/Footer";
import { pageMeta, siteConfig } from "@/config/site";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: pageMeta(
      "Política de privacidade",
      `Como o ${siteConfig.name} trata seus dados pessoais.`,
    ),
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { name, contact } = siteConfig;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 py-16">
        <article className="container mx-auto max-w-3xl space-y-6 leading-relaxed text-foreground">
          <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-5xl">
            Política de privacidade
          </h1>
          <p className="text-muted-foreground">
            Esta política explica como o {name} coleta e usa seus dados ao agendar um horário, em
            conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
          </p>

          <h2 className="font-serif text-xl font-semibold">Dados que coletamos</h2>
          <p>
            Nome, telefone/WhatsApp e, opcionalmente, e-mail e observações informados no
            agendamento, além do serviço, data e horário escolhidos.
          </p>

          <h2 className="font-serif text-xl font-semibold">Para que usamos</h2>
          <p>
            Exclusivamente para registrar e gerenciar seu agendamento, confirmar ou lembrar o
            horário (por e-mail ou WhatsApp) e entrar em contato caso seja necessário remarcar. Não
            vendemos nem compartilhamos seus dados com terceiros para fins de marketing.
          </p>

          <h2 className="font-serif text-xl font-semibold">Armazenamento e segurança</h2>
          <p>
            Os dados ficam em banco de dados com acesso restrito e criptografia em trânsito. Apenas
            a equipe do {name} acessa o painel administrativo.
          </p>

          <h2 className="font-serif text-xl font-semibold">Seus direitos</h2>
          <p>
            Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento, e
            cancelar seus agendamentos em “Meus agendamentos”.
            {contact.email
              ? ` Escreva para ${contact.email}`
              : ` Fale conosco pelo WhatsApp ${contact.phoneDisplay}`}
            .
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
