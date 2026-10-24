import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const SERVER_ONLY = {
  name: "server-only",
  message:
    "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
};

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      ".agents",
      ".claude",
      ".tanstack",
      ".wrangler",
      "archive-lovable",
      "src/routeTree.gen.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Fronteiras entre camadas (veja docs/ARQUITETURA.md). Cada camada só enxerga as de baixo.
  // O ESLint não mescla `no-restricted-imports` entre blocos, então cada um repete a regra do server-only.
  layer("src/domain/**/*.{ts,tsx}", [
    ...inner("application", "infrastructure", "actions", "features", "shared", "components", "routes", "integrations"),
    ...pkgs("react", "react-dom", "@supabase/*", "@tanstack/*"),
  ]),
  layer("src/application/**/*.{ts,tsx}", [
    ...inner("infrastructure", "actions", "features", "shared", "components", "routes", "integrations"),
    ...pkgs("react", "react-dom", "@supabase/*", "@tanstack/*"),
  ]),
  layer("src/infrastructure/**/*.{ts,tsx}", [
    ...inner("actions", "features", "shared", "components", "routes"),
    ...pkgs("react", "react-dom"),
  ]),
  layer("src/{features,shared,components}/**/*.{ts,tsx}", [
    ...inner("infrastructure", "application"),
    {
      group: ["@/integrations/supabase/client.server"],
      message: "Código de tela não pode usar a chave de serviço; chame uma server function em src/actions.",
    },
  ]),
  eslintPluginPrettier,
);

function inner(...layers) {
  return layers.map((name) => ({
    group: [`@/${name}`, `@/${name}/*`],
    message: `Camada inválida: este código não pode depender de "${name}".`,
  }));
}

function pkgs(...names) {
  return names.map((name) => ({
    group: [name],
    message: `Pacote "${name}" não é permitido nesta camada.`,
  }));
}

function layer(file, patterns) {
  return {
    files: [file],
    rules: { "no-restricted-imports": ["error", { paths: [SERVER_ONLY], patterns }] },
  };
}
