import { Typography } from "./typography";

export function CourseChip({ code, name }: { code: string; name: string }) {
  return (
    <span
      title={`${code} · ${name}`}
      className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-bg-weak-50 px-2.5 py-1 align-middle"
    >
      <Typography as="span" variant="code" className="shrink-0 text-text-sub-600">
        {code}
      </Typography>
      <Typography as="span" variant="caption" className="truncate">
        {name}
      </Typography>
    </span>
  );
}
