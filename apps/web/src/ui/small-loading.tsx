import { RiLoader4Line } from "@remixicon/react";

export function SmallLoading({ label }: { label: string }) {
  return (
    <span role="status" className="inline-flex text-text-sub-600">
      <RiLoader4Line aria-hidden="true" className="size-5 motion-safe:animate-spin" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
