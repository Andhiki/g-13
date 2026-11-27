import type { LecturerReviewsInput } from "../-shared/schemas";
import type { createDatabase } from "@g13/db/client";
import {
  getLecturerDetailData,
  getLecturerDirectoryData,
  getLecturerReviewRows,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type DirectoryData = Awaited<ReturnType<typeof getLecturerDirectoryData>>;
type DetailData = NonNullable<Awaited<ReturnType<typeof getLecturerDetailData>>>;

function equalWeightAverage(clarity: number, support: number, organization: number): number;
function equalWeightAverage(
  clarity: number | null,
  support: number | null,
  organization: number | null,
): number | null;
function equalWeightAverage(
  clarity: number | null,
  support: number | null,
  organization: number | null,
): number | null {
  if (clarity === null || support === null || organization === null) return null;
  return (Number(clarity) + Number(support) + Number(organization)) / 3;
}

export function composeLecturerDirectory(data: DirectoryData) {
  const coursesByLecturer = new Map<string, DirectoryData["courseAggregates"]>();
  for (const course of data.courseAggregates) {
    const lecturerCourses = coursesByLecturer.get(course.lecturerId) ?? [];
    lecturerCourses.push(course);
    coursesByLecturer.set(course.lecturerId, lecturerCourses);
  }

  return {
    courses: data.courses,
    lecturers: data.lecturers.map((lecturer) => ({
      id: lecturer.id,
      name: lecturer.name,
      reviewCount: Number(lecturer.reviewCount),
      overallAverage: equalWeightAverage(
        lecturer.clarityAverage,
        lecturer.supportAverage,
        lecturer.organizationAverage,
      ),
      courses: (coursesByLecturer.get(lecturer.id) ?? []).map((course) => ({
        courseId: course.courseId,
        code: course.code,
        nameId: course.nameId,
        nameEn: course.nameEn,
        overallAverage: equalWeightAverage(
          course.clarityAverage,
          course.supportAverage,
          course.organizationAverage,
        ),
      })),
    })),
  };
}

function composeLecturerDetail(data: DetailData) {
  const { lecturer, courses } = data;
  return {
    lecturer: {
      ...lecturer,
      overallAverage: equalWeightAverage(
        lecturer.clarityAverage,
        lecturer.supportAverage,
        lecturer.organizationAverage,
      ),
      courses,
    },
  };
}

export async function getLecturerReviewsPage(db: Database, input: LecturerReviewsInput) {
  const page = await getLecturerReviewRows(db, input);
  return {
    ...page,
    reviews: page.reviews.map((review) => ({
      ...review,
      overall: equalWeightAverage(review.clarity, review.support, review.organization),
    })),
  };
}

export async function getLecturerDirectory(db: Database) {
  return composeLecturerDirectory(await getLecturerDirectoryData(db));
}

export async function getLecturerDetail(db: Database, lecturerId: string) {
  const data = await getLecturerDetailData(db, lecturerId);
  return data ? composeLecturerDetail(data) : null;
}
