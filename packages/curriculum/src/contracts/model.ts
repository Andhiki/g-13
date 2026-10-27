import type { CurriculumId } from "../registry";
export type { CurriculumId } from "../registry";
type Section = "core" | "interest" | "elective";

export type Placement = {
  section: Section;
  label: string;
  group: string;
  semester: number | null;
  semesterLabel: string;
  credits: number | null;
  prerequisiteRaw: string;
  printedPage: number | null;
  pdfPage: number | null;
};

export type Course = {
  id: string;
  code: string;
  title: string;
  englishTitle: string;
  placements: Placement[];
};

export type Curriculum = {
  id: CurriculumId;
  edition: string;
  all: Course[];
  core: Course[];
  electives: Course[];
  groups: { name: string; count: number }[];
  requiredCredits: number;
  totalCredits: number;
  summary: string;
  sourceTitle: string;
  sourceUrl: string | null;
  readingNotes: string[];
};
