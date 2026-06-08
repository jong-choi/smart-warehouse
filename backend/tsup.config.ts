import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/utils/seedData.ts"],
  format: ["cjs"],
  target: "node18",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  external: [
    "express",
    "cors",
    "morgan",
    "swagger-ui-express",
    "swagger-jsdoc",
    "@prisma/client",
    "prisma",
    "dotenv",
    "jsonfile",
    "zod",
    "@langchain/anthropic",
    "@langchain/community",
    "@langchain/core",
    "langchain",
    "@upstash/redis",
    "@faker-js/faker",
  ],
});
