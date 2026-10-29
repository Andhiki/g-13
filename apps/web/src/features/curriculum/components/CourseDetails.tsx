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
        <div
          role="status"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg-white-0/90 text-primary-base"
        >
          <span
            aria-hidden="true"
            className="size-24 bg-current [mask:url('/theme/sonic-dancing.gif')_center/contain_no-repeat]"
          />
          <p className="m-0 animate-pulse text-label-md motion-reduce:animate-none">
            {text("Biar kami masak dulu…")}
          </p>
          <span className="sr-only">{text("Memuat detail mata kuliah…")}</span>
        </div>
      }
    >
      <CourseDetailsPanel {...props} onLoaded={setLoaded} />
    </DeferredContent>
  );
}
