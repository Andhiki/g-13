import { createFileRoute } from "@tanstack/react-router";
import { LecturerDetailPage } from "../features/lecturer-reviews/LecturerDetailPage";
import { lecturerDetailQueryOptions } from "../features/lecturer-reviews/queries";

export const Route = createFileRoute("/lecturers/$lecturerId")({
  loader: async ({ context, params }) => {
    await context.queryClient.query(lecturerDetailQueryOptions(params.lecturerId));
  },
  head: ({ match }) => {
    const data = match.context.queryClient.getQueryData(
      lecturerDetailQueryOptions(match.params.lecturerId).queryKey,
    );
    const title = data
      ? `${data.lecturer.name} · ${match.context.common["Dosen dan ulasan"]}`
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
  component: () => <LecturerDetailPage lecturerId={Route.useParams().lecturerId} />,
});
