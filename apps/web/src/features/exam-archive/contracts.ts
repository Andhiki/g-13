export type ExamPaper = {
  id: string;
  name: string;
  exam: "UTS" | "UAS" | null;
  mimeType: string;
  createdAt: string | null;
  sourceFolderId: string;
};

export type ExamYear = { name: string; createdAt: string | null; papers: ExamPaper[] };

export type ExamCourse = {
  id: string;
  name: string;
  sourceFolderId: string;
  createdAt: string | null;
  years: ExamYear[];
};

export type ArchiveLocation = [] | [courseId: string] | [courseId: string, year: string];
