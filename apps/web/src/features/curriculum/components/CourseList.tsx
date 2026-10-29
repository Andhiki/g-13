import { useLocale } from "../../../useLocale";
import { Typography } from "../../../ui/typography";
import { animate } from "motion/react";
import { useEffect, useMemo } from "react";
import type { Course } from "@g13/curriculum";
import { groupCoursesForList } from "../list-groups";
import { CourseTable } from "./CourseTable";

export function CourseList({
  navigation,
  onVisibleSemesters,
  courses,
  selectedId,
  select,
}: {
  navigation: { semester: number } | null;
  onVisibleSemesters: (semesters: number[]) => void;
  courses: Course[];
  selectedId: string | null;
  select: (id: string) => void;
}) {
  const { text, language } = useLocale();
  const sections = useMemo(() => groupCoursesForList(courses, language), [courses, language]);

  useEffect(() => {
    const update = () => {
      const semesters = [...document.querySelectorAll<HTMLElement>("[data-semester]")]
        .filter((element) => {
          const bounds = element.getBoundingClientRect();
          return (
            bounds.bottom > window.innerHeight * 0.25 && bounds.top < window.innerHeight * 0.75
          );
        })
        .map((element) => Number(element.dataset.semester));
      onVisibleSemesters(semesters);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections, onVisibleSemesters]);

  useEffect(() => {
    if (!navigation) return;
    const section = document.getElementById(`semester-${navigation.semester}`);
    if (!section) return;
    const headerHeight = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--app-header-height"),
    );
    const top = headerHeight + (window.matchMedia("(width < 1100px)").matches ? 144 : 128);
    const target = Math.max(
      0,
      Math.min(
        window.scrollY + section.getBoundingClientRect().top - top,
        document.documentElement.scrollHeight - window.innerHeight,
      ),
    );
    const animation = animate(window.scrollY, target, {
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => window.scrollTo(0, value),
    });
    const stop = () => animation.stop();
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    return () => {
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [navigation]);

  if (!sections.length) {
    return (
      <Typography as="p" variant="paragraph" className="p-4 text-text-sub-600" role="status">
        {text("Tidak ada mata kuliah pada filter ini.")}
      </Typography>
    );
  }

  return (
    <div
      className="space-y-10 [&>section+section]:border-t [&>section+section]:border-stroke-soft-200 [&>section+section]:pt-6"
      aria-label={text("Daftar mata kuliah")}
    >
      {sections.map((section) => (
        <CourseTable key={section.id} section={section} selectedId={selectedId} select={select} />
      ))}
    </div>
  );
}
