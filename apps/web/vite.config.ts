import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { host: true },
  build: { sourcemap: true },
  environments: { client: { build: { sourcemap: false } } },
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      persistState: process.env.E2E_D1_LOCAL_PATH
        ? { path: process.env.E2E_D1_LOCAL_PATH }
        : undefined,
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: false,
        filter: ({ path }) =>
          !path.includes("?") &&
          !path.startsWith("/dashboard") &&
          !path.startsWith("/resources") &&
          !path.startsWith("/lecturers") &&
          !path.startsWith("/alumni") &&
          !path.startsWith("/api"),
      },
    }),
    react(),
  ],
});
