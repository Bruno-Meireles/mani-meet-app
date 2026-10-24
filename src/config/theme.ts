/**
 * Tema do salão. A paleta inteira (claro e escuro) é gerada a partir de poucas escolhas
 * (preset, matiz, intensidade, fontes), para trocar a identidade visual de um cliente em uma linha.
 * Funções puras: nada aqui depende de React ou do navegador.
 */

export type ThemeSpec = {
  /** Matiz da cor principal, 0–360 (rosa ≈ 8, lilás ≈ 305, verde ≈ 150, azul ≈ 240). */
  hue: number;
  /** Intensidade da cor principal, 0–0.2. */
  chroma: number;
  /** Matiz dos fundos e bordas neutros (tons de papel). */
  surfaceHue: number;
  /** Matiz do detalhe dourado/complementar. */
  accentHue: number;
  /** Arredondamento base dos cantos. */
  radius: string;
  fontHeading: string;
  fontBody: string;
};

export const THEME_PRESETS = {
  rose: { hue: 8, chroma: 0.1, surfaceHue: 55, accentHue: 85 },
  lilac: { hue: 305, chroma: 0.1, surfaceHue: 320, accentHue: 85 },
  sage: { hue: 150, chroma: 0.08, surfaceHue: 110, accentHue: 70 },
  terracotta: { hue: 40, chroma: 0.12, surfaceHue: 65, accentHue: 95 },
  ocean: { hue: 240, chroma: 0.09, surfaceHue: 230, accentHue: 80 },
} as const satisfies Record<string, Pick<ThemeSpec, "hue" | "chroma" | "surfaceHue" | "accentHue">>;

export type ThemePresetName = keyof typeof THEME_PRESETS;

export type ThemeInput = Partial<ThemeSpec> & { preset: ThemePresetName };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Aceita só nomes de fonte simples, para o valor nunca virar CSS ou URL arbitrária. */
const safeFont = (name: string) => name.replace(/[^A-Za-z0-9 -]/g, "").trim();

export function resolveTheme(input: ThemeInput): ThemeSpec {
  const preset = THEME_PRESETS[input.preset];
  return {
    hue: clamp(input.hue ?? preset.hue, 0, 360),
    chroma: clamp(input.chroma ?? preset.chroma, 0, 0.2),
    surfaceHue: clamp(input.surfaceHue ?? preset.surfaceHue, 0, 360),
    accentHue: clamp(input.accentHue ?? preset.accentHue, 0, 360),
    radius: /^[0-9.]+(rem|px)$/.test(input.radius ?? "") ? (input.radius as string) : "1rem",
    fontHeading: safeFont(input.fontHeading ?? "Playfair Display") || "Playfair Display",
    fontBody: safeFont(input.fontBody ?? "DM Sans") || "DM Sans",
  };
}

const num = (n: number) => String(Number(n.toFixed(3)));
const ok = (l: number, c: number, h: number, alpha?: string) =>
  `oklch(${num(l)} ${num(c)} ${num(h)}${alpha ? ` / ${alpha}` : ""})`;

type Vars = Record<string, string>;

function lightVars(t: ThemeSpec): Vars {
  const { hue: h, chroma: c, surfaceHue: s, accentHue: g } = t;
  return {
    "--background": ok(0.985, 0.008, s),
    "--foreground": ok(0.27, 0.03, h + 12),
    "--card": ok(1, 0, 0),
    "--card-foreground": ok(0.25, 0.04, h + 22),
    "--popover": ok(1, 0, 0),
    "--popover-foreground": ok(0.25, 0.04, h + 22),
    "--primary": ok(0.6, c, h),
    "--primary-foreground": ok(0.99, 0.005, h + 12),
    "--secondary": ok(0.945, 0.025, s - 15),
    "--secondary-foreground": ok(0.35, 0.05, h + 22),
    "--muted": ok(0.955, 0.015, s - 5),
    "--muted-foreground": ok(0.5, 0.03, h + 12),
    "--accent": ok(0.93, 0.035, h + 22),
    "--accent-foreground": ok(0.3, 0.05, h + 22),
    "--destructive": ok(0.55, 0.18, 25),
    "--destructive-foreground": ok(1, 0, 0),
    "--border": ok(0.91, 0.02, s - 10),
    "--input": ok(0.91, 0.02, s - 10),
    "--ring": ok(0.6, c, h),
    "--rose": ok(0.82, c * 0.7, h + 2),
    "--rose-foreground": ok(1, 0, 0),
    "--gold": ok(0.78, 0.1, g),
    "--gold-foreground": ok(0.25, 0.04, h + 22),
    "--cream": ok(0.965, 0.015, s + 5),
    "--cream-foreground": ok(0.3, 0.04, h + 22),
    "--chart-1": ok(0.65, 0.14, h + 7),
    "--chart-2": ok(0.75, 0.1, g),
    "--chart-3": ok(0.55, 0.08, 200),
    "--chart-4": ok(0.7, 0.12, 60),
    "--chart-5": ok(0.6, 0.1, 30),
    "--sidebar": ok(0.97, 0.01, g - 5),
    "--sidebar-foreground": ok(0.25, 0.04, h + 22),
    "--sidebar-primary": ok(0.65, c * 1.2, h + 7),
    "--sidebar-primary-foreground": ok(1, 0, 0),
    "--sidebar-accent": ok(0.92, 0.04, g - 5),
    "--sidebar-accent-foreground": ok(0.3, 0.05, h + 22),
    "--sidebar-border": ok(0.9, 0.02, g - 15),
    "--sidebar-ring": ok(0.65, c, h + 7),
  };
}

function darkVars(t: ThemeSpec): Vars {
  const { hue: h, chroma: c, accentHue: g } = t;
  return {
    "--background": ok(0.22, 0.03, h + 22),
    "--foreground": ok(0.95, 0.01, g - 5),
    "--card": ok(0.28, 0.04, h + 22),
    "--card-foreground": ok(0.95, 0.01, g - 5),
    "--popover": ok(0.28, 0.04, h + 22),
    "--popover-foreground": ok(0.95, 0.01, g - 5),
    "--primary": ok(0.7, c * 1.2, h + 7),
    "--primary-foreground": ok(0.15, 0.03, h + 22),
    "--secondary": ok(0.35, 0.05, h + 22),
    "--secondary-foreground": ok(0.95, 0.01, g - 5),
    "--muted": ok(0.35, 0.05, h + 22),
    "--muted-foreground": ok(0.7, 0.04, h + 22),
    "--accent": ok(0.35, 0.05, h + 22),
    "--accent-foreground": ok(0.95, 0.01, g - 5),
    "--destructive": ok(0.6, 0.18, 25),
    "--destructive-foreground": ok(1, 0, 0),
    "--border": ok(1, 0, 0, "12%"),
    "--input": ok(1, 0, 0, "15%"),
    "--ring": ok(0.7, c, h + 7),
    "--rose": ok(0.68, c * 1.2, h + 7),
    "--rose-foreground": ok(1, 0, 0),
    "--gold": ok(0.72, 0.09, g),
    "--gold-foreground": ok(0.2, 0.03, h + 22),
    "--cream": ok(0.3, 0.04, h + 22),
    "--cream-foreground": ok(0.95, 0.01, g - 5),
    "--chart-1": ok(0.7, 0.12, h + 7),
    "--chart-2": ok(0.75, 0.1, g),
    "--chart-3": ok(0.55, 0.08, 200),
    "--chart-4": ok(0.7, 0.12, 60),
    "--chart-5": ok(0.6, 0.1, 30),
    "--sidebar": ok(0.28, 0.04, h + 22),
    "--sidebar-foreground": ok(0.95, 0.01, g - 5),
    "--sidebar-primary": ok(0.7, c * 1.2, h + 7),
    "--sidebar-primary-foreground": ok(0.15, 0.03, h + 22),
    "--sidebar-accent": ok(0.35, 0.05, h + 22),
    "--sidebar-accent-foreground": ok(0.95, 0.01, g - 5),
    "--sidebar-border": ok(1, 0, 0, "12%"),
    "--sidebar-ring": ok(0.7, c, h + 7),
  };
}

const block = (selector: string, vars: Vars) =>
  `${selector}{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}`;

/** CSS com as variáveis do tema. Vai num `<style>` no `<head>` e sobrescreve os padrões de `styles.css`. */
export function themeToCss(theme: ThemeSpec): string {
  const shared: Vars = {
    "--radius": theme.radius,
    "--font-heading": `"${theme.fontHeading}",Georgia,serif`,
    "--font-body": `"${theme.fontBody}",system-ui,sans-serif`,
  };
  return [block(":root", { ...shared, ...lightVars(theme) }), block(".dark", darkVars(theme))].join(
    "\n",
  );
}

/** URL do Google Fonts com as duas famílias do tema. */
export function googleFontsHref(theme: ThemeSpec): string {
  const family = (name: string, weights: string) =>
    `family=${name.replace(/ /g, "+")}:wght@${weights}`;
  const families = [
    ...new Set([family(theme.fontHeading, "500;600;700"), family(theme.fontBody, "400;500;600")]),
  ];
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
