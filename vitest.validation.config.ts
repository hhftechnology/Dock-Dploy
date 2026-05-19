import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: [
      "src/utils/validation/**/*.{test,spec}.ts",
      "src/utils/__tests__/generators.golden.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: [
        "src/utils/validation/**/*.ts",
        "src/utils/converters.ts",
      ],
      exclude: ["src/utils/validation/**/*.{test,spec}.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 65,
        statements: 80,
      },
    },
  },
});
