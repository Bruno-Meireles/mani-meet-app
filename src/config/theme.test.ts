import { describe, expect, it } from "vitest";
import { THEME_PRESETS, googleFontsHref, resolveTheme, themeToCss } from "./theme";

describe("themeToCss", () => {
  it("gera variáveis para claro e escuro", () => {
    const css = themeToCss(resolveTheme({ preset: "rose" }));
    expect(css).toContain(":root{");
    expect(css).toContain(".dark{");
    expect(css).toContain("--primary:oklch(0.6 0.1 8)");
    expect(css).toContain("--radius:1rem");
  });

  it("todos os presets geram o mesmo conjunto de variáveis", () => {
    const keys = (preset: keyof typeof THEME_PRESETS) =>
      [...themeToCss(resolveTheme({ preset })).matchAll(/(--[a-z0-9-]+):/g)]
        .map((m) => m[1])
        .sort();
    const base = keys("rose");
    for (const preset of Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[]) {
      expect(keys(preset)).toEqual(base);
    }
  });

  it("a cor-base muda a cor primária", () => {
    const rose = themeToCss(resolveTheme({ preset: "rose" }));
    const lilac = themeToCss(resolveTheme({ preset: "lilac" }));
    expect(rose).not.toEqual(lilac);
    expect(lilac).toContain("--primary:oklch(0.6 0.1 305)");
  });

  it("permite sobrescrever o matiz sem trocar de preset", () => {
    const css = themeToCss(resolveTheme({ preset: "rose", hue: 200 }));
    expect(css).toContain("--primary:oklch(0.6 0.1 200)");
  });

  it("limita valores fora da faixa", () => {
    const css = themeToCss(resolveTheme({ preset: "rose", hue: 999, chroma: 5 }));
    expect(css).toContain("--primary:oklch(0.6 0.2 360)");
  });

  it("monta as fontes do Google sem duplicar famílias", () => {
    const href = googleFontsHref(resolveTheme({ preset: "rose" }));
    expect(href).toContain("family=Playfair+Display");
    expect(href).toContain("family=DM+Sans");
    expect(href.startsWith("https://fonts.googleapis.com/css2?")).toBe(true);
  });

  it("não ataca com CSS vindo da configuração", () => {
    const css = themeToCss(
      resolveTheme({ preset: "rose", fontHeading: 'Evil"; } body{display:none' }),
    );
    expect(css).not.toContain("body{display:none");
  });
});
