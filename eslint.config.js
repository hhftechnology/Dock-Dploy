import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const NO_USE_EFFECT_MESSAGE =
  "Direct use of useEffect is banned. Use derived state, event handlers, key-resets, or useMountEffect() instead. See docs/no-useeffect.md.";

const NO_INLINE_STYLE_MESSAGE =
  "Inline style={{...}} object literals are banned. Use design tokens via classes or var(--token) in src/styles.css.";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/routeTree.gen.ts",
      "scripts/**",
      ".claude/**",
      ".cursor/**",
      "**/*.cjs",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Catch direct named imports of useEffect specifically. We don't
      // include this rule in `no-restricted-imports` because namespace imports
      // (`import * as React from "react"`) reach `useEffect` through the
      // namespace and produce false positives — the call-expression rule below
      // catches the real offence.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ImportDeclaration[source.value='react'] > ImportSpecifier[imported.name='useEffect']",
          message: NO_USE_EFFECT_MESSAGE,
        },
        {
          selector: "CallExpression[callee.name='useEffect']",
          message: NO_USE_EFFECT_MESSAGE,
        },
        {
          selector:
            "CallExpression[callee.object.name='React'][callee.property.name='useEffect']",
          message: NO_USE_EFFECT_MESSAGE,
        },
        {
          selector:
            "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression",
          message: NO_INLINE_STYLE_MESSAGE,
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["src/hooks/useMountEffect.ts"],
    rules: {
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
    },
  },
  {
    // shadcn/ui primitives are vendored from upstream templates that use a
    // small set of idiomatic inline styles. We accept them rather than
    // diverging from the upstream output.
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    // The CodeMirror runtime + lazy wrapper deliberately use style={{}} for
    // dynamically-computed editor sizing.
    files: [
      "src/components/CodeEditor.tsx",
      "src/components/CodeMirrorRuntime.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // Marketplace card + VPN provider tiles apply token-valued backgrounds
    // (CSS variables) via inline style — the value is data-driven per tile.
    files: [
      "src/components/templates/TemplateCard.tsx",
      "src/components/compose-builder/VpnTab/VpnProviderTiles.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "src/__tests__/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
