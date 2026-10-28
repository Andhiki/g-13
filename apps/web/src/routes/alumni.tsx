import { createFileRoute } from "@tanstack/react-router";
import { AlumniPage } from "../features/alumni/AlumniPage";

export const Route = createFileRoute("/alumni")({
  head: () => ({
    meta: [
      { title: "Meet Our Alumni" },
      {
        name: "description",
        content:
          "Meet Ilmu Komputer UGM alumni building products, leading teams, and growing careers across technology.",
      },
    ],
  }),
  component: AlumniPage,
});
