import { expect, test } from "bun:test";
import { resolve, relative } from "node:path";

test("shared course and graph modules stay independent of page implementations", async () => {
  for (const file of new Bun.Glob("{courses,graph}/**/*.{ts,tsx}").scanSync({
    cwd: import.meta.dir,
  })) {
    if (file.endsWith(".test.ts")) continue;
    const source = await Bun.file(`${import.meta.dir}/${file}`).text();
    for (const match of source.matchAll(/(?:from\s*|import\s*\(\s*)["'](\.[^"']+)["']/g)) {
      const imported = relative(import.meta.dir, resolve(import.meta.dir, file, "..", match[1]));
      expect(
        imported.startsWith("features/") || imported.startsWith("routes/"),
        `${file} imports ${imported}`,
      ).toBe(false);
    }
  }
});
