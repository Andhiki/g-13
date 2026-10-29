import { defineConfig } from "tsdown";

import { registry } from "./src/registry-data";

export default defineConfig({
  entry: ["src/index.ts"],
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
  ],
  format: "esm",
  dts: true,
  sourcemap: false,
});
