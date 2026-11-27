import { createFileRoute } from "@tanstack/react-router";
import { LecturerReviewsPage } from "./lecturers/-components/LecturerReviewsPage";
import { lecturerDirectoryQueryOptions } from "./lecturers/-client/queries";

import { validateLecturerSearch } from "./lecturers/-shared/search";

export const Route = createFileRoute("/_public/lecturers/")({
  validateSearch: validateLecturerSearch,
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
