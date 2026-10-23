import { RiListUnordered, RiNodeTree } from "@remixicon/react";
import { AlignButton } from "../../../ui/button";

export function ViewSwitch({
  view,
  onViewChange,
}: {
  view: "map" | "list";
  onViewChange: (view: "map" | "list") => void;
}) {
  const Icon = view === "map" ? RiListUnordered : RiNodeTree;

  return (
    <AlignButton.Root
      variant="neutral"
      mode="stroke"
      size="medium"
      aria-pressed={view === "list"}
      title={view === "map" ? "Tampilkan daftar" : "Tampilkan peta"}
      onClick={() => onViewChange(view === "map" ? "list" : "map")}
    >
      <Icon className="size-5" aria-hidden="true" />
      Switch View
    </AlignButton.Root>
  );
}
