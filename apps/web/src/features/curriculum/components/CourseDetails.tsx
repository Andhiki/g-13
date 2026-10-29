import { useLocale } from "../../../useLocale";
import { lazy, useEffect, useState } from "react";
import { DeferredContent } from "../../../ui/deferred-content";
import type { CourseDetailsProps } from "./CourseDetailsPanel";

const CourseDetailsPanel = lazy(() =>
  import("./CourseDetailsPanel").then((module) => ({
    default: function LoadedDetails({
      onLoaded,
      ...props
    }: CourseDetailsProps & { onLoaded: (loaded: boolean) => void }) {
      useEffect(() => onLoaded(true), [onLoaded]);
      return <module.CourseDetailsPanel {...props} />;
    },
  })),
);

export function CourseDetails(props: CourseDetailsProps) {
  const { text } = useLocale();
  const [loaded, setLoaded] = useState(false);
  if (!props.course && !loaded) return null;
  return (
    <DeferredContent
      fallback={
        <p role="status" className="fixed bottom-4 left-4 z-50 rounded-lg bg-bg-white-0 p-4">
          {text("Memuat detail mata kuliah…")}
        </p>
      }
    >
      <CourseDetailsPanel {...props} onLoaded={setLoaded} />
    </DeferredContent>
  );
}
