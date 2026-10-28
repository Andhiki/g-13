import { AlignTooltip } from "../../ui/tooltip";
import { Typography } from "../../ui/typography";
import { RiInformationLine } from "@remixicon/react";
import { AlignButton } from "../../ui/button";
import { AlignModal } from "../../ui/modal";
import type { Roadmap } from "./planner";

export function RoadmapNotes({
  plan,
  target,
  sourceTitle,
}: {
  plan: Roadmap;
  target: number;
  sourceTitle: string;
}) {
  return (
    <AlignModal.Root>
      <AlignTooltip.Provider>
        <AlignTooltip.Root>
          <AlignTooltip.Trigger asChild>
            <AlignModal.Trigger asChild>
              <AlignButton.Root
                variant="neutral"
                mode="stroke"
                className="size-10 p-0"
                aria-label="Catatan roadmap"
              >
                <RiInformationLine className="size-5" aria-hidden="true" />
              </AlignButton.Root>
            </AlignModal.Trigger>
          </AlignTooltip.Trigger>
          <AlignTooltip.Content size="xsmall" side="left">
            Catatan roadmap
            {plan.conflicts.length ? ` · ${plan.conflicts.length} hal perlu diperiksa` : ""}
          </AlignTooltip.Content>
        </AlignTooltip.Root>
      </AlignTooltip.Provider>
      <AlignModal.Content className="max-w-[560px] max-h-[85dvh] overflow-y-auto">
        <div className="p-5 pr-12">
          <AlignModal.Title asChild>
            <Typography as="h2" variant="title" className="m-0">
              Catatan roadmap
            </Typography>
          </AlignModal.Title>
        </div>
        <AlignModal.Description asChild>
          <Typography as="p" variant="caption" className="sr-only">
            Pemeriksaan rencana, asumsi, dan sumber kurikulum.
          </Typography>
        </AlignModal.Description>
        <div className="space-y-6 overflow-y-auto p-5 pt-0">
          <section className="space-y-2">
            <Typography as="h3" variant="subtitle2" className="m-0">
              {plan.conflicts.length
                ? `${plan.conflicts.length} hal perlu diperiksa`
                : "Pemeriksaan rencana"}
            </Typography>
            {target === 7 && plan.conflicts.length > 0 && (
              <Typography as="p" variant="paragraph" className="text-text-sub-600">
                Bandingkan target 8 semester untuk mencari ruang tambahan. Skenario 8 semester juga
                perlu diperiksa.
              </Typography>
            )}
            {plan.conflicts.length ? (
              <ul className="list-disc space-y-2 pl-4 text-text-sub-600">
                {plan.conflicts.map((text) => (
                  <li key={text}>
                    <Typography as="span" variant="paragraph">
                      {text}
                    </Typography>
                  </li>
                ))}
              </ul>
            ) : (
              <Typography variant="paragraph" className="text-text-sub-600">
                Tidak ada konflik pada pemeriksaan dasar. Ini belum menjamin kelayakan KRS atau
                kelulusan.
              </Typography>
            )}
          </section>
          <section className="space-y-2">
            <Typography as="h3" variant="subtitle2" className="m-0">
              Asumsi dan sumber
            </Typography>
            <Typography variant="paragraph" className="text-text-sub-600">
              {sourceTitle}. Semester panduan bukan jadwal penawaran aktual.
            </Typography>
            <ul className="list-disc space-y-2 pl-4 text-text-sub-600">
              {plan.notes.map((text) => (
                <li key={text}>
                  <Typography as="span" variant="paragraph">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
