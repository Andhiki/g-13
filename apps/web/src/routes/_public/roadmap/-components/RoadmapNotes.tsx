import { useLocale } from "@/useLocale";
import { AlignTooltip } from "@/ui/tooltip";
import { Typography } from "@/ui/typography";
import { RiInformationLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignModal } from "@/ui/modal";
import { formatConflict } from "../-shared/conflict-format";
import type { Roadmap } from "../-shared/planner";

function RoadmapNotesTrigger({ conflictCount }: { conflictCount: number }) {
  const { text } = useLocale("roadmap");
  return (
    <AlignTooltip.Provider>
      <AlignTooltip.Root>
        <AlignTooltip.Trigger asChild>
          <AlignModal.Trigger asChild>
            <AlignButton.Root
              variant="neutral"
              mode="stroke"
              iconOnly
              aria-label={text("Catatan roadmap")}
            >
              <RiInformationLine className="size-5" aria-hidden="true" />
            </AlignButton.Root>
          </AlignModal.Trigger>
        </AlignTooltip.Trigger>
        <AlignTooltip.Content size="xsmall" side="left">
          {text("Catatan roadmap")}
          {conflictCount ? text(" · {{v0}} hal perlu diperiksa", { v0: conflictCount }) : ""}
        </AlignTooltip.Content>
      </AlignTooltip.Root>
    </AlignTooltip.Provider>
  );
}

function RoadmapConflictsSection({
  conflicts,
  target,
}: {
  conflicts: Roadmap["conflicts"];
  target: number;
}) {
  const { text, courseName } = useLocale("roadmap");
  return (
    <section className="space-y-2">
      <Typography as="h3" variant="subtitle2" className="m-0">
        {conflicts.length
          ? text("{{v0}} hal perlu diperiksa", { v0: conflicts.length })
          : text("Pemeriksaan rencana")}
      </Typography>
      {target === 7 && conflicts.length > 0 && (
        <Typography as="p" variant="paragraph" color="muted">
          {text(
            "Bandingkan target 8 semester untuk mencari ruang tambahan. Skenario 8 semester juga perlu diperiksa.",
          )}
        </Typography>
      )}
      {conflicts.length ? (
        <ul className="list-disc space-y-2 pl-4 text-text-sub-600">
          {conflicts.map((note) => (
            <li key={JSON.stringify(note)}>
              <Typography as="span" variant="paragraph">
                {formatConflict(note, { text, courseName })}
              </Typography>
            </li>
          ))}
        </ul>
      ) : (
        <Typography variant="paragraph" color="muted">
          {text(
            "Tidak ada konflik pada pemeriksaan dasar. Ini belum menjamin kelayakan KRS atau kelulusan.",
          )}
        </Typography>
      )}
    </section>
  );
}

function RoadmapAssumptionsSection({
  sourceTitle,
  notes,
}: {
  sourceTitle: string;
  notes: Roadmap["notes"];
}) {
  const { text } = useLocale("roadmap");
  return (
    <section className="space-y-2">
      <Typography as="h3" variant="subtitle2" className="m-0">
        {text("Asumsi dan sumber")}
      </Typography>
      <Typography variant="paragraph" color="muted">
        {sourceTitle}
        {text(". Semester panduan bukan jadwal penawaran aktual.")}
      </Typography>
      <ul className="list-disc space-y-2 pl-4 text-text-sub-600">
        {notes.map((note) => (
          <li key={JSON.stringify(note)}>
            <Typography as="span" variant="paragraph">
              {text(note)}
            </Typography>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RoadmapNotes({
  plan,
  target,
  sourceTitle,
}: {
  plan: Roadmap;
  target: number;
  sourceTitle: string;
}) {
  const { text } = useLocale("roadmap");
  return (
    <AlignModal.Root>
      <RoadmapNotesTrigger conflictCount={plan.conflicts.length} />
      <AlignModal.Content className="max-w-[560px]">
        <AlignModal.Header>
          <AlignModal.Title asChild>
            <Typography as="h2" variant="title" className="m-0">
              {text("Catatan roadmap")}
            </Typography>
          </AlignModal.Title>
          <AlignModal.Description asChild>
            <Typography as="p" variant="caption" className="sr-only">
              {text("Pemeriksaan rencana, asumsi, dan sumber kurikulum.")}
            </Typography>
          </AlignModal.Description>
        </AlignModal.Header>
        <AlignModal.Body className="space-y-6">
          <RoadmapConflictsSection conflicts={plan.conflicts} target={target} />
          <RoadmapAssumptionsSection sourceTitle={sourceTitle} notes={plan.notes} />
        </AlignModal.Body>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
