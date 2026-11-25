import { defineConfig } from "tsdown";

import { registry } from "./src/registry-data";
import { searchParams } from "./src/search-index-data";

export default defineConfig({
  entry: ["src/index.ts", "src/ids.ts", "src/search-index.ts"],
  plugins: [
    {
      name: "precompute-curricula",
      transform: {
        filter: { id: /\/registry-data\.ts$/ },
        handler() {
          const entries = Object.entries(registry).map(([id, { curriculum, rules, syllabi }]) => {
            const { all, core, electives, ...metadata } = curriculum;
            const references = (courses: typeof all) =>
              courses.map((course) => `all[${all.indexOf(course)}]`).join(",");
            return `${JSON.stringify(id)}: (() => { const all = ${JSON.stringify(all)}; return { curriculum: { ...${JSON.stringify(metadata)}, all, core: [${references(core)}], electives: [${references(electives)}] }, rules: ${JSON.stringify(rules)}, syllabi: ${JSON.stringify(syllabi)} }; })()`;
          });
          return `export const registry = {${entries.join(",")}};`;
        },
      },
    },
    {
      name: "precompute-search-params",
      transform: {
        filter: { id: /\/search-index-data\.ts$/ },
        handler() {
          return `export const searchParams = ${JSON.stringify(searchParams)};`;
        },
      },
    },
  ],
  format: "esm",
  dts: true,
  sourcemap: false,
});
