import { createFileRoute } from "@tanstack/react-router";
import { FaqPage } from "../features/faq/FaqPage";

export const Route = createFileRoute("/faq")({
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["FAQ"] },
      {
        name: "description",
        content:
          match.context.common[
            "Pertanyaan umum tentang studi S1 Ilmu Komputer UGM, kurikulum, tugas akhir, dan aturan akademik."
          ],
      },
    ],
  }),
  component: FaqPage,
});
