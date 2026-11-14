import { createFileRoute } from "@tanstack/react-router";
import { LecturerReviewsPage } from "../features/lecturer-reviews/LecturerReviewsPage";
import { lecturerDirectoryQueryOptions } from "../features/lecturer-reviews/queries";

export const Route = createFileRoute("/lecturers/")({
  loader: async ({ context }) => {
    await context.queryClient.query(lecturerDirectoryQueryOptions());
  },
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Dosen dan ulasan"] },
      { property: "og:title", content: match.context.common["Dosen dan ulasan"] },
      {
        name: "description",
        content:
          match.context.common["Jelajahi pengalaman komunitas bersama dosen Ilmu Komputer UGM."],
      },
    ],
  }),
  component: LecturerReviewsPage,
});
