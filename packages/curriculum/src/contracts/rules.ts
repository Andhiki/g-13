import type { Curriculum } from "./model";

export type AcademicOption = { value: string; label: string; detail: string };
export type Syllabus = {
  title: string;
  description: string;
  syllabus: string;
  references: string[];
  printedPage: number;
  pdfPage: number;
  alternatives?: Syllabus[];
};

export type AcademicRules = {
  choiceDetail: string;
  interestMode: "laboratory" | "specialization";
  doubleDegreeWithoutInterest: boolean;
  excludedCoreIds: string[];
  religionChoiceIds: string[];
  preferredElectives: Record<string, string[]>;
  internship: {
    note: string;
    noInternshipNote: string | null;
  } & (
    | { kind: "activity"; options: (AcademicOption & { fullSemester: boolean })[] }
    | {
        kind: "credited";
        options: (AcademicOption & { fullSemester: boolean; courseId: string })[];
      }
  );
  exposure: { internshipDetail: string; doubleDegreeDetail: string };
  scheduling: {
    graduationIds: string[];
    proposalId: string;
    proposalAfterRequirements: boolean;
    practicalWorkId: string | null;
    beforeDoubleDegree: { courseId: string; semester: number }[];
    overflowCourseIds: string[];
    electiveSemesterStep: number;
    communityService: { courseId: string; companionIds: string[] } | null;
    starredPrerequisitesConcurrent: boolean;
  };
};

export type CurriculumSlice = {
  curriculum: Curriculum;
  rules: AcademicRules;
  syllabi: Record<string, Syllabus>;
};
