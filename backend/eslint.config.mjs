import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "prisma/dev.db",
      "prisma/migrations/**",
      "logs/**",
      "data/**",
      "src/generated/**",
      "check-data.js",
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // 미사용 요소 정리: import는 에러, 변수는 경고(언더스코어 허용)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // 팀 컨벤션: any 허용 (경고/에러 차단)
      "@typescript-eslint/no-explicit-any": "off",

      // switch-case 내 선언 경고 제거
      "no-case-declarations": "off",
    },
  }
);

