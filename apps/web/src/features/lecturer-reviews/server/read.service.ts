import type { createDatabase } from "@g13/db";
import { getLecturerDetailData, getLecturerDirectoryData } from "./repository";

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

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
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

export function composeLecturerDetail(data: DetailData) {
  const reviews = data.reviews.map((review) => ({
    ...review,
    overall: equalWeightAverage(review.clarity, review.support, review.organization),
  }));
  const coursesById = new Map(
    reviews.map((review) => [
      review.courseId,
      { id: review.courseId, code: review.code, nameId: review.nameId, nameEn: review.nameEn },
    ]),
  );

  return {
    lecturer: {
      ...data.lecturer,
      reviewCount: reviews.length,
      overallAverage: mean(reviews.map((review) => review.overall)),
      clarityAverage: mean(reviews.map((review) => review.clarity)),
      supportAverage: mean(reviews.map((review) => review.support)),
      organizationAverage: mean(reviews.map((review) => review.organization)),
      courses: [...coursesById.values()],
    },
    courses: data.courses,
    reviews,
  };
}

export async function getLecturerDirectory(db: Database) {
  return composeLecturerDirectory(await getLecturerDirectoryData(db));
}

export async function getLecturerDetail(db: Database, lecturerId: string) {
  const data = await getLecturerDetailData(db, lecturerId);
  return data ? composeLecturerDetail(data) : null;
}
