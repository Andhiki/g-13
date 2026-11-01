import { useLocale } from "../../../useLocale";
import { RiListUnordered, RiNodeTree } from "@remixicon/react";
import { AlignTooltip } from "../../../ui/tooltip";
import { AlignButton } from "../../../ui/button";

export function ViewSwitch({
  view,
  onViewChange,
}: {
  view: "map" | "list";
  onViewChange: (view: "map" | "list") => void;
}) {
  const { text } = useLocale();
  const label = view === "map" ? text("Tampilkan daftar") : text("Tampilkan peta");
  const Icon = view === "map" ? RiListUnordered : RiNodeTree;

  return (
    <AlignTooltip.Provider>
      <AlignTooltip.Root>
        <AlignTooltip.Trigger asChild>
          <AlignButton.Root
            variant="neutral"
            mode="stroke"
            size="medium"
            className="size-10 p-0"
            aria-pressed={view === "list"}
            aria-keyshortcuts="V"
            aria-label={text(label)}
            onClick={() => onViewChange(view === "map" ? "list" : "map")}
          >
            <span className="flex" aria-hidden="true">
              <Icon className="size-5" />
            </span>
          </AlignButton.Root>
        </AlignTooltip.Trigger>
        <AlignTooltip.Content size="xsmall" side="bottom">
          {text(label)}
        </AlignTooltip.Content>
      </AlignTooltip.Root>
    </AlignTooltip.Provider>
  );
}
