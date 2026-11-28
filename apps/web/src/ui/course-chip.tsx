import type { ReactNode } from "react";

export function CourseChip({
  code,
  name,
  muted = false,
  codeContent = code,
  nameContent = name,
}: {
  code: string;
  name: string;
  muted?: boolean;
  /** Display override, e.g. search highlighting; `code` still drives the tooltip. */
  codeContent?: ReactNode;
  /** Display override, e.g. search highlighting; `name` still drives the tooltip. */
  nameContent?: ReactNode;
}) {
  return (
    <span
      title={`${code} · ${name}`}
      className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-bg-weak-50 px-2.5 py-1 align-middle text-label-2xs font-normal"
    >
      <span className="shrink-0 font-mono text-text-sub-600">{codeContent}</span>
      <span className={muted ? "truncate text-text-sub-600" : "truncate"}>{nameContent}</span>
    </span>
  );
}
