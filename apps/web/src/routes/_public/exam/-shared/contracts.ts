export type ExamPaper = {
  id: string;
  name: string;
  exam: "UTS" | "UAS" | null;
  mimeType: string;
  createdAt: string | null;
  sourceFolderId: string;
};

export type ExamYear = { name: string; createdAt: string | null; papers: ExamPaper[] };

/** What the archive root needs to list and search a course. */
export type ExamCourseSummary = { id: string; name: string; createdAt: string | null };

/** Paper metadata for one course, kept in its own module so it loads on demand. */
export type ExamCourseDetail = { sourceFolderId: string; years: ExamYear[] };

export type ExamCourse = ExamCourseSummary & ExamCourseDetail;

export type ExamCourseEntry = ExamCourseSummary & {
  load: () => Promise<{ default: ExamCourseDetail }>;
};

export type ArchiveLocation = [] | [courseId: string] | [courseId: string, year: string];
