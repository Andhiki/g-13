import { createFileRoute } from "@tanstack/react-router";
import { AlumniPage } from "../features/alumni/AlumniPage";

export const Route = createFileRoute("/alumni")({
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Meet Our Alumni"] },
      {
        name: "description",
        content:
          match.context.common[
            "Meet Ilmu Komputer UGM alumni building products, leading teams, and growing careers across technology."
          ],
      },
    ],
  }),
  component: AlumniPage,
});
