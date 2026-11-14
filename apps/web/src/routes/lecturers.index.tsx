import { createFileRoute, notFound } from "@tanstack/react-router";
import { LecturerReviewsPage } from "../features/lecturer-reviews/LecturerReviewsPage";
import { loadLecturerDirectory } from "../features/lecturer-reviews/server";

export const Route = createFileRoute("/lecturers/")({
  loader: async () => {
    const data = await loadLecturerDirectory();
    if (!data) throw notFound();
    return data;
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
  component: () => <LecturerReviewsPage data={Route.useLoaderData()} />,
});
