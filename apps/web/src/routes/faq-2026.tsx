import { createFileRoute } from "@tanstack/react-router";
import { CurriculumFaqPage } from "../features/curriculum-faq/CurriculumFaqPage";

export const Route = createFileRoute("/faq-2026")({
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["FAQ Kurikulum 2026"] },
      {
        name: "description",
        content:
          match.context.common[
            "Ringkasan pertanyaan tentang aturan akademik Kurikulum 2026 S1 Ilmu Komputer UGM."
          ],
      },
    ],
  }),
  component: CurriculumFaqPage,
});
