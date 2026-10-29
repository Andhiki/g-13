import { createFileRoute } from "@tanstack/react-router";
import { ExamArchivePage } from "../features/exam-archive/ExamArchivePage";
import { validateArchiveSearch } from "../features/exam-archive/search";

export const Route = createFileRoute("/exam")({
  validateSearch: validateArchiveSearch,
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Arsip Ujian"] },
      {
        name: "description",
        content:
          match.context.common[
            "Temukan arsip soal UTS dan UAS Ilmu Komputer UGM dari Himakom, dikelompokkan menurut mata kuliah dan tahun."
          ],
      },
    ],
  }),
  component: ExamArchivePage,
});
