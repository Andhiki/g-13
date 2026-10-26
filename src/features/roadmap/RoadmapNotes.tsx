import { RiInformationLine, RiCloseLine } from "@remixicon/react";
import { AlignButton } from "../../ui/button";
import { AlignDrawer } from "../../ui/drawer";
import { CompactButton } from "../../ui/compact-button";
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
    <AlignDrawer.Root>
      <AlignDrawer.Trigger asChild>
        <AlignButton.Root variant="neutral" mode="stroke">
          <RiInformationLine className="size-5" aria-hidden="true" />
          Catatan{plan.conflicts.length ? ` · ${plan.conflicts.length}` : ""}
        </AlignButton.Root>
      </AlignDrawer.Trigger>
      <AlignDrawer.Content>
        <AlignDrawer.Header>
          <AlignDrawer.Title className="flex-1 text-label-lg">Catatan roadmap</AlignDrawer.Title>
          <AlignDrawer.Close asChild>
            <CompactButton aria-label="Tutup catatan roadmap">
              <RiCloseLine aria-hidden="true" />
            </CompactButton>
          </AlignDrawer.Close>
        </AlignDrawer.Header>
        <AlignDrawer.Description className="sr-only">
          Pemeriksaan rencana, asumsi, dan sumber kurikulum.
        </AlignDrawer.Description>
        <AlignDrawer.Body className="space-y-6 overflow-y-auto p-5 pt-0 text-paragraph-sm">
          <section>
            <h2 className="m-0 text-label-sm">
              {plan.conflicts.length
                ? `${plan.conflicts.length} hal perlu diperiksa`
                : "Pemeriksaan rencana"}
            </h2>
            {target === 7 && plan.conflicts.length > 0 && (
              <p>
                Bandingkan target 8 semester untuk mencari ruang tambahan. Skenario 8 semester juga
                perlu diperiksa.
              </p>
            )}
            {plan.conflicts.length ? (
              <ul className="space-y-3 pl-4 text-text-sub-600">
                {plan.conflicts.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            ) : (
              <p className="text-text-sub-600">
                Tidak ada konflik pada pemeriksaan dasar. Ini belum menjamin kelayakan KRS atau
                kelulusan.
              </p>
            )}
          </section>
          <section>
            <h2 className="m-0 text-label-sm">Asumsi dan sumber</h2>
            <p className="text-text-sub-600">
              {sourceTitle}. Semester panduan bukan jadwal penawaran aktual.
            </p>
            <ul className="space-y-3 pl-4 text-text-sub-600">
              {plan.notes.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </section>
        </AlignDrawer.Body>
      </AlignDrawer.Content>
    </AlignDrawer.Root>
  );
}
