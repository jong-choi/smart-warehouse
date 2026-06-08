import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    visualizer({
      open: process.env.ANALYZE === "true",
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  css: {
    postcss: "./postcss.config.js",
  },
});
