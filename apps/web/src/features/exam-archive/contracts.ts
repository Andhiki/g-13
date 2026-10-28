export type ExamPaper = {
  id: string;
  name: string;
  exam: "UTS" | "UAS" | null;
  mimeType: string;
  sourceFolderId: string;
};

export type ExamCourse = {
  id: string;
  name: string;
  sourceFolderId: string;
  years: { name: string; papers: ExamPaper[] }[];
};

export type ArchiveLocation = [] | [courseId: string] | [courseId: string, year: string];
