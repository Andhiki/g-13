import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/auth.ts"],
  format: "esm",
  dts: true,
  sourcemap: false,
});
