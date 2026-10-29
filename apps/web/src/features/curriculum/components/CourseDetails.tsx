import { useLocale } from "../../../useLocale";
import { lazy, useEffect, useState } from "react";
import { DeferredContent } from "../../../ui/deferred-content";
import { AlignDrawer } from "../../../ui/drawer";
import { CompactButton } from "../../../ui/compact-button";
import { RiCloseLine } from "@remixicon/react";
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
        <AlignDrawer.Root
          modal={props.modal ?? true}
          open={props.course !== null}
          onOpenChange={(open) => !open && props.close()}
        >
          <AlignDrawer.Content
            modal={props.modal ?? true}
            aria-describedby={undefined}
            onInteractOutside={
              props.modal === false ? (event) => event.preventDefault() : undefined
            }
            className="min-[650px]:top-[var(--app-header-height)] max-[650px]:fixed max-[650px]:inset-x-0 max-[650px]:top-auto max-[650px]:bottom-0 max-[650px]:h-[30dvh] max-[650px]:max-w-none max-[650px]:rounded-t-10 max-[650px]:border-r-0 max-[650px]:border-t max-[650px]:data-[state=open]:slide-in-from-bottom-full max-[650px]:data-[state=closed]:slide-out-to-bottom-full max-[650px]:data-[state=open]:[--tw-enter-translate-x:0%] max-[650px]:data-[state=closed]:[--tw-exit-translate-x:0%]"
          >
            <AlignDrawer.Title className="sr-only">
              {text("Memuat detail mata kuliah…")}
            </AlignDrawer.Title>
            <AlignDrawer.Close asChild>
              <CompactButton
                className="absolute right-4 top-4"
                aria-label={text("Tutup detail mata kuliah")}
              >
                <RiCloseLine className="size-5" aria-hidden="true" />
              </CompactButton>
            </AlignDrawer.Close>
            <div
              role="status"
              className="flex flex-1 flex-col items-center justify-center gap-4 text-primary-base"
            >
              <span
                aria-hidden="true"
                className="size-24 bg-current [mask:url('/theme/sonic-dancing.gif')_center/contain_no-repeat]"
              />
              <p className="m-0 animate-pulse text-label-md motion-reduce:animate-none">
                {text("Biar kami masak dulu…")}
              </p>
            </div>
          </AlignDrawer.Content>
        </AlignDrawer.Root>
      }
    >
      <CourseDetailsPanel {...props} onLoaded={setLoaded} />
    </DeferredContent>
  );
}
