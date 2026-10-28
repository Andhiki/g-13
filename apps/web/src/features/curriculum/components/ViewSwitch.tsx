import { useState } from "react";
import { RiListUnordered, RiNodeTree } from "@remixicon/react";
import { m, useReducedMotion } from "motion/react";
import { AlignTooltip } from "../../../ui/tooltip";
import { AlignButton } from "../../../ui/button";

export function ViewSwitch({
  view,
  onViewChange,
}: {
  view: "map" | "list";
  onViewChange: (view: "map" | "list") => void;
}) {
  const [turns, setTurns] = useState(0);
  const reducedMotion = useReducedMotion();
  const label = view === "map" ? "Tampilkan daftar" : "Tampilkan peta";
  const Icon = view === "map" ? RiListUnordered : RiNodeTree;

  return (
    <AlignTooltip.Provider>
      <AlignTooltip.Root>
        <AlignTooltip.Trigger asChild>
          <AlignButton.Root
            variant="neutral"
            mode="stroke"
            size="medium"
            className="size-10 rounded-full p-0"
            aria-pressed={view === "list"}
            aria-label={label}
            onClick={() => {
              setTurns((value) => value + 1);
              onViewChange(view === "map" ? "list" : "map");
            }}
          >
            <m.span
              className="flex"
              aria-hidden="true"
              initial={false}
              animate={{ rotate: turns * 360 }}
              transition={{ duration: reducedMotion ? 0 : 0.4, ease: "easeOut" }}
            >
              <Icon className="size-5" />
            </m.span>
          </AlignButton.Root>
        </AlignTooltip.Trigger>
        <AlignTooltip.Content size="xsmall" side="left">
          {label}
        </AlignTooltip.Content>
      </AlignTooltip.Root>
    </AlignTooltip.Provider>
  );
}
