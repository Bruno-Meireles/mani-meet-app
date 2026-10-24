import { chromium } from "@playwright/test";

const out = process.argv[2];
const browser = await chromium.launch({ channel: "chrome" });
for (const [name, w, h] of [["m", 390, 844], ["d", 1440, 900]]) {
  for (const v of ["A", "B", "C"]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`http://localhost:5197/agendar?variant=${v}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${v}-${name}-1.png`, fullPage: false });
    // escolhe o primeiro serviço e o primeiro dia habilitado
    await page.getByRole("combobox", { name: "Serviço" }).click();
    await page.getByRole("option").first().click();
    if (v === "B") await page.getByRole("button", { name: "Continuar" }).click();
    if (v === "C") {
      await page.locator("[role=group][aria-label=Dia] button:not([disabled])").first().click();
    } else {
      await page.locator("table button:not([disabled])").first().click();
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${v}-${name}-2.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
