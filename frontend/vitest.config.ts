import viteTsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// https://vitest.dev/guide/
export default defineConfig({
  plugins: [viteTsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/__tests__/setup-tests.ts",
    exclude: ["**/node_modules/**", "**/e2e/**"],
    coverage: {
      include: ["src/**"],
    },
  },
});
