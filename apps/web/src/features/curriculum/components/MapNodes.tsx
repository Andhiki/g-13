import { memo } from "react";
import { Typography } from "../../../ui/typography";
import { Handle, Position, useStore, type Node, type NodeProps } from "@xyflow/react";
import { tv } from "tailwind-variants";
import { creditsFor, isCore } from "../course-utils";
import type { CourseNodeData, LaneNodeData } from "../map-layout";

const courseStyles = tv({
  slots: {
    root: "group relative w-[246px] animate-in fade-in-0 transition-opacity duration-150 motion-reduce:animate-none",
    surface:
      "border border-stroke-soft-200 bg-bg-white-0 group-hover:border-stroke-sub-300 group-hover:bg-bg-weak-50",
    title:
      "m-0 line-clamp-2 text-text-strong-950 group-hover:text-text-strong-950 group-focus-within:text-text-strong-950",
    handle:
      "size-[7px]! border! border-bg-white-0! bg-bg-sub-300! transition-opacity duration-150 motion-reduce:transition-none",
    credit:
      "bg-[color-mix(in_srgb,var(--color-bg-weak-50)_65%,var(--color-bg-white-0))] group-hover:bg-bg-weak-50",
  },
  variants: {
    choice: {
      true: {
        surface:
          "border-[color-mix(in_srgb,var(--color-blue-500)_30%,var(--color-stroke-soft-200))] bg-[color-mix(in_srgb,var(--color-blue-500)_8%,var(--color-bg-white-0))] group-hover:border-[color-mix(in_srgb,var(--color-blue-500)_50%,var(--color-stroke-sub-300))] group-hover:bg-[color-mix(in_srgb,var(--color-blue-500)_13%,var(--color-bg-white-0))]",
        title: "text-text-strong-950",
        credit:
          "bg-[color-mix(in_srgb,var(--color-blue-500)_14%,var(--color-bg-white-0))] group-hover:bg-[color-mix(in_srgb,var(--color-blue-500)_18%,var(--color-bg-white-0))]",
      },
    },
    state: {
      selected: {
        surface:
          "border-primary-base bg-primary-lighter group-hover:border-primary-base group-hover:bg-primary-lighter",
        title: "text-text-strong-950",
        handle: "bg-primary-base!",
        credit:
          "bg-[color-mix(in_srgb,var(--color-bg-weak-50)_65%,var(--color-primary-lighter))] group-hover:bg-[color-mix(in_srgb,var(--color-bg-weak-50)_65%,var(--color-primary-lighter))]",
      },
      prerequisite: {
        surface: "border-warning-dark group-hover:border-warning-dark",
        title: "text-text-strong-950",
        handle: "bg-warning-dark!",
      },
      dependent: {
        surface: "border-feature-dark group-hover:border-feature-dark",
        title: "text-text-strong-950",
        handle: "bg-feature-dark!",
      },
      unrelated: { root: "opacity-[0.42]" },
    },
  },
});

const tab = "h-[25px] truncate rounded-t-lg border-b-0 px-3 pt-[3px] text-text-sub-600";

export const CourseNode = memo(function CourseNode({
  id,
  data,
}: NodeProps<Node<CourseNodeData, "course">>) {
  const incomingVisible = useStore((state) =>
    state.edges.some((edge) => edge.target === id && !edge.hidden && edge.data?.visible),
  );
  const outgoingVisible = useStore((state) =>
    state.edges.some((edge) => edge.source === id && !edge.hidden && edge.data?.visible),
  );
  const course = data.course;
  const credit = creditsFor(course);
  const choice = !isCore(course);
  const styles = courseStyles({ choice, state: data.state ?? undefined });
  return (
    <div
      className={styles.root()}
      data-course={course.id}
      data-course-kind={choice ? "choice" : "core"}
      data-course-state={data.state ?? undefined}
    >
      <div
        data-course-surface
        aria-hidden="true"
        className={styles.surface({
          class: "pointer-events-none absolute inset-x-0 top-6 bottom-0 rounded-[0_8px_8px_8px]",
        })}
      />
      {data.incoming.length > 0 && (
        <Handle
          id="in"
          type="target"
          position={Position.Left}
          className={styles.handle({ class: incomingVisible ? "opacity-100!" : "opacity-0!" })}
        />
      )}
      <button
        data-course-button
        type="button"
        className="relative flex h-[82px] w-full cursor-pointer flex-col items-stretch rounded-lg border-0 bg-transparent px-3 pt-[34px] pb-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-base"
        onClick={() => data.choose(course.id)}
        aria-label={"Buka detail " + course.title}
        aria-pressed={data.state === "selected"}
      >
        <div data-course-metadata className="absolute inset-x-0 top-0 flex items-center">
          <Typography
            as="span"
            variant="caption"
            className={styles.surface({ class: tab + " max-w-[calc(100%-72px)]" })}
          >
            {course.code || "Slot pilihan"}
          </Typography>
          <Typography
            as="span"
            variant="caption"
            className={styles.surface({
              class: tab + " -ml-px flex-none " + styles.credit(),
            })}
          >
            {credit === null ? "—" : credit + " SKS"}
          </Typography>
        </div>
        <Typography data-course-title as="strong" variant="label" className={styles.title()}>
          {course.title}
        </Typography>
      </button>
      {data.outgoing.length > 0 && (
        <Handle
          id="out"
          type="source"
          position={Position.Right}
          className={styles.handle({ class: outgoingVisible ? "opacity-100!" : "opacity-0!" })}
        />
      )}
    </div>
  );
});

export const LaneNode = memo(function LaneNode({ data }: NodeProps<Node<LaneNodeData, "lane">>) {
  return (
    <div
      data-map-lane
      className={
        "pointer-events-none flex size-full items-center justify-center " +
        (data.active ? "text-primary-base" : "text-text-sub-600")
      }
    >
      <Typography as="strong" variant="label">
        {data.title}
      </Typography>
    </div>
  );
});
