import { chromium, type FullConfig } from "@playwright/test";

const PAGES = ["/", "/agendar", "/sobre", "/meus-agendamentos", "/login", "/privacidade"];

/**
 * O servidor de desenvolvimento otimiza dependências no primeiro acesso a cada página e recarrega.
 * Abrir todas uma vez antes dos testes evita que essa "partida a frio" apareça como falha de teste.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  const channel = config.projects[0]?.use.channel;
  const browser = await chromium.launch(channel ? { channel } : {});
  const page = await browser.newPage();
  for (const path of PAGES) {
    await page.goto(`${baseURL}${path}`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
  }
  await browser.close();
}
