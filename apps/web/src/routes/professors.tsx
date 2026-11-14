import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProfessorReviewsPage } from "../features/professor-reviews/ProfessorReviewsPage";
import { loadProfessorReviews } from "../features/professor-reviews/server";

export const Route = createFileRoute("/professors")({
  loader: async () => {
    const data = await loadProfessorReviews();
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
  component: () => <ProfessorReviewsPage data={Route.useLoaderData()} />,
});
