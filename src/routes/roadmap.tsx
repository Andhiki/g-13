import { createFileRoute } from "@tanstack/react-router";
import { RoadmapPage } from "../features/roadmap/RoadmapPage";
import { validateRoadmapSearch } from "../features/roadmap/search";

export const Route = createFileRoute("/roadmap")({
  validateSearch: validateRoadmapSearch,
  head: () => ({ meta: [{ title: "Roadmap Kuliah · Ilmu Komputer UGM" }] }),
  component: RoadmapPage,
});
