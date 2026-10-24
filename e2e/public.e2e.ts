import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/", "/agendar", "/sobre", "/meus-agendamentos", "/login", "/privacidade"];
const VIEWPORTS = [
  { name: "celular", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

/** Espera o React assumir o elemento, para o teste não agir antes da hidratação. */
const hydrated = (page: Page, selector: string) =>
  page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps"));
  }, selector);

/** Só mede depois de CSS, fontes e rede estabilizarem (o servidor de dev compila sob demanda). */
async function horizontalOverflow(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test.describe("páginas públicas em três larguras", () => {
  for (const vp of VIEWPORTS) {
    for (const path of PAGES) {
      test(`${path} @ ${vp.name} (${vp.width}px): abre, tem um h1 e não rola na horizontal`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      });
    }
  }
});

test("a página inicial leva ao agendamento", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Agendar agora" }).first().click();
  await expect(page).toHaveURL(/\/agendar$/);
  await expect(page.getByRole("heading", { name: "Agende seu horário" })).toBeVisible();
});

test("menu do celular abre, navega e fecha", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Sobre" }).first().click();
  await expect(page).toHaveURL(/\/sobre$/);
});

test.describe("tela de agendamento", () => {
  test("mostra os três passos e bloqueia a confirmação até escolher horário", async ({ page }) => {
    await page.goto("/agendar");
    for (const step of ["Escolha o serviço", "Dia e horário", "Seus dados"]) {
      await expect(page.getByRole("heading", { name: step })).toBeVisible();
    }
    await expect(
      page.getByText("Escolha um serviço e um dia para ver os horários livres."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Confirmar agendamento" }).first(),
    ).toBeDisabled();
  });

  test("o serviço é escolhido em um dropdown compacto, sem cartões", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/agendar");
    await expect(page.getByRole("combobox", { name: "Serviço" })).toBeVisible();
    await expect(page.getByRole("radiogroup")).toHaveCount(0);
    const calendarTop = await page.getByRole("heading", { name: "Dia e horário" }).boundingBox();
    expect(calendarTop?.y).toBeLessThan(700);
    await expect(page.getByRole("button", { name: "Confirmar agendamento" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Próximos dias" })).toBeVisible();
  });

  test("campos de dados têm rótulo associado", async ({ page }) => {
    await page.goto("/agendar");
    await expect(page.getByLabel("Nome completo")).toBeVisible();
    await expect(page.getByLabel("Telefone / WhatsApp")).toBeVisible();
    await expect(page.getByLabel(/E-mail/)).toBeVisible();
  });

  test("o calendário é anunciado em português", async ({ page }) => {
    await page.goto("/agendar");
    await hydrated(page, "form button[type=button]");
    await page.getByRole("button", { name: "Outra data" }).click();
    await expect(page.getByRole("button", { name: "Mês anterior" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Próximo mês" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Go to|Today/ })).toHaveCount(0);
  });

  test("dias do calendário têm alvo de toque de pelo menos 36px no celular", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/agendar");
    await hydrated(page, "form button[type=button]");
    await page.getByRole("button", { name: "Outra data" }).click();
    const day = page.getByRole("button", { name: /hoje/ }).first();
    // O popover abre com animação de zoom; mede só depois que o tamanho assenta.
    await expect
      .poll(async () => (await day.boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(36);
    expect((await day.boundingBox())?.height).toBeGreaterThanOrEqual(36);
  });
});

test("consulta de agendamentos: o campo de telefone tem rótulo", async ({ page }) => {
  await page.goto("/meus-agendamentos");
  await expect(page.getByLabel("WhatsApp usado no agendamento")).toBeVisible();
});

test.describe("acesso administrativo", () => {
  test("rota protegida redireciona quem não está logado", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login mantém o que foi digitado quando falha", async ({ page }) => {
    await page.goto("/login");
    await hydrated(page, "form button[type=submit]");
    await page.getByLabel("Email").fill("alguem@exemplo.com");
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar com email" }).click();
    await expect(page.locator("[data-sonner-toast][data-type='error']")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue("alguem@exemplo.com");
    await expect(page.getByLabel("Senha")).toHaveValue("senha-errada");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login não exibe credenciais de demonstração", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).not.toContainText("demo@teste.com");
  });
});

test("robots.txt e sitemap respondem", async ({ request }) => {
  expect((await request.get("/robots.txt")).status()).toBe(200);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");
});
