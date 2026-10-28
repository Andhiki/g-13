import { lazy, Suspense, useState } from "react";
import type { CourseDetailsProps } from "./CourseDetailsPanel";

const CourseDetailsPanel = lazy(() =>
  import("./CourseDetailsPanel").then((module) => ({ default: module.CourseDetailsPanel })),
);

export function CourseDetails(props: CourseDetailsProps) {
  const [opened, setOpened] = useState(false);
  if (props.course && !opened) setOpened(true);
  if (!props.course && !opened) return null;
  return (
    <Suspense
      fallback={
        <p role="status" className="fixed bottom-4 left-4 z-50 rounded-lg bg-bg-white-0 p-4">
          Memuat detail mata kuliah…
        </p>
      }
    >
      <CourseDetailsPanel {...props} />
    </Suspense>
  );
}
