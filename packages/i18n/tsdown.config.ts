import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/messages.ts"],
  format: "esm",
  dts: true,
  sourcemap: false,
});
