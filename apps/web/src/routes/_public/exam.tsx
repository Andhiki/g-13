import { createFileRoute } from "@tanstack/react-router";
import { ExamArchivePage } from "./exam/-components/ExamArchivePage";
import { validateArchiveSearch } from "./exam/-shared/search";
import { loadExamCourse } from "./exam/-shared/archive";

export const Route = createFileRoute("/_public/exam")({
  validateSearch: validateArchiveSearch,
  // Paper metadata is split per course; the root only needs the course index.
  loaderDeps: ({ search }) => ({ course: search.course }),
  loader: ({ deps }) => loadExamCourse(deps.course),
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
