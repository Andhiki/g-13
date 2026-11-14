import { createFileRoute, notFound } from "@tanstack/react-router";
import { LecturerDetailPage } from "../features/lecturer-reviews/LecturerDetailPage";
import { loadLecturerDetail } from "../features/lecturer-reviews/server";

export const Route = createFileRoute("/lecturers/$lecturerId")({
  loader: async ({ params }) => {
    const data = await loadLecturerDetail({ data: { lecturerId: params.lecturerId } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ match, loaderData }) => {
    const title = loaderData
      ? `${loaderData.lecturer.name} · ${match.context.common["Dosen dan ulasan"]}`
      : match.context.common["Dosen dan ulasan"];
    return {
      meta: [
        { title },
        { property: "og:title", content: title },
        {
          name: "description",
          content:
            match.context.common["Jelajahi pengalaman komunitas bersama dosen Ilmu Komputer UGM."],
        },
      ],
    };
  },
  component: () => <LecturerDetailPage data={Route.useLoaderData()} />,
});
