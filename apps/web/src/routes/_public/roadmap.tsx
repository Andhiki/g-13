import { createFileRoute } from "@tanstack/react-router";
import { RoadmapPage } from "./roadmap/-components/RoadmapPage";
import { validateRoadmapSearch } from "./roadmap/-shared/search";

export const Route = createFileRoute("/_public/roadmap")({
  validateSearch: validateRoadmapSearch,
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Roadmap Personal"] },
      { property: "og:title", content: match.context.common["Roadmap Personal"] },
      {
        name: "description",
        content:
          match.context.common[
            "Susun rencana kuliah S1 Ilmu Komputer UGM per semester berdasarkan kurikulum, peminatan, kegiatan, dan target lulus 7 atau 8 semester."
          ],
      },
      {
        property: "og:description",
        content:
          match.context.common[
            "Susun rencana kuliah S1 Ilmu Komputer UGM per semester berdasarkan kurikulum, peminatan, kegiatan, dan target lulus 7 atau 8 semester."
          ],
      },
    ],
  }),
  component: RoadmapPage,
});
