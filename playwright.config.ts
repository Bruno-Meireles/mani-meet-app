import { defineConfig } from "@playwright/test";

const PORT = 5199;

/**
 * Testes de navegador determinísticos: o servidor sobe com variáveis FALSAS do Supabase,
 * então nada depende de serviço externo nem toca em dados reais. Fluxos que precisam do banco
 * (concluir um agendamento, painel logado) ficam fora desta suíte; veja docs/assessment.md.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  workers: 3,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Usa o Chrome instalado no sistema; não baixa navegadores. Em CI, defina PLAYWRIGHT_CHANNEL=.
    channel: process.env["PLAYWRIGHT_CHANNEL"] ?? "chrome",
    // Para depurar uma falha: PLAYWRIGHT_TRACE=retain-on-failure npm run test:e2e
    trace: (process.env["PLAYWRIGHT_TRACE"] as "retain-on-failure" | undefined) ?? "off",
  },
  webServer: {
    command: `npx vite dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: "http://127.0.0.1:9",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
      SUPABASE_URL: "http://127.0.0.1:9",
      SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
    },
  },
});
