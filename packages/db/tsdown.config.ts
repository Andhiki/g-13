import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    client: "src/client.ts",
    "schema/announcements": "src/schema/announcements.ts",
    "schema/auth": "src/schema/auth.ts",
    "schema/courses": "src/schema/courses.ts",
    "schema/lecturers": "src/schema/lecturers.ts",
    "schema/lecturer-reviews": "src/schema/lecturer-reviews.ts",
    "schema/notifications": "src/schema/notifications.ts",
    "schema/theses": "src/schema/theses.ts",
  },
  format: "esm",
  dts: true,
  sourcemap: false,
});
