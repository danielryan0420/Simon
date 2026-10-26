import { defineConfig } from "vite";

export default defineConfig({
  base: "/Simon/",
  build: {
    target: "es2020",
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
