import { createFileRoute } from "@tanstack/react-router";
import { RoadmapPage } from "../features/roadmap/RoadmapPage";
import { validateRoadmapSearch } from "../features/roadmap/search";

export const Route = createFileRoute("/roadmap")({
  validateSearch: validateRoadmapSearch,
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Roadmap Personal"] },
      {
        name: "description",
        content:
          match.context.common[
            "Susun rencana kuliah S1 Ilmu Komputer UGM per semester berdasarkan kurikulum, peminatan, kegiatan, dan target lulus 7 atau 8 semester."
          ],
      },
    ],
  }),
  component: RoadmapPage,
});
