import { createFileRoute } from "@tanstack/react-router";
import { ExamArchivePage } from "./exam/-components/ExamArchivePage";
import { validateArchiveSearch } from "./exam/-shared/search";

export const Route = createFileRoute("/exam")({
  validateSearch: validateArchiveSearch,
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Arsip Ujian"] },
      { property: "og:title", content: match.context.common["Arsip Ujian"] },
      {
        name: "description",
        content:
          match.context.common[
            "Temukan arsip soal UTS dan UAS Ilmu Komputer UGM dari Himakom, dikelompokkan menurut mata kuliah dan tahun."
          ],
      },
      {
        property: "og:description",
        content:
          match.context.common[
            "Temukan arsip soal UTS dan UAS Ilmu Komputer UGM dari Himakom, dikelompokkan menurut mata kuliah dan tahun."
          ],
      },
    ],
  }),
  component: ExamArchivePage,
});
