import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    client: "src/client.ts",
    "schema/announcements": "src/schema/announcements.ts",
    "schema/auth": "src/schema/auth.ts",
    "schema/courses": "src/schema/courses.ts",
    "schema/learning-resources": "src/schema/learning-resources.ts",
    "schema/lecturers": "src/schema/lecturers.ts",
    "schema/lecturer-reviews": "src/schema/lecturer-reviews.ts",
    "schema/notifications": "src/schema/notifications.ts",
    "schema/theses": "src/schema/theses.ts",
    "schema/thesis-fields": "src/schema/thesis-fields.ts",
  },
  format: "esm",
  dts: true,
  sourcemap: false,
});
