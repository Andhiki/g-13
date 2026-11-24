import { RiAddLine, RiArrowDownLine, RiArrowUpLine, RiDeleteBinLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { AdminFormField } from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import type { AdminThesis } from "./AdminThesisRow";
import {
  type LecturerOption,
  type SupervisorDraft,
  type FieldErrors,
  supervisorRoleOptions,
  SelectField,
} from "./ThesisFormFields";

export function newSupervisor(): SupervisorDraft {
  return { key: crypto.randomUUID(), lecturerId: "", name: "", role: "" };
}

export function supervisorDrafts(thesis: AdminThesis | null): SupervisorDraft[] {
  if (!thesis || thesis.supervisors.length === 0) return [newSupervisor()];
  return thesis.supervisors.map((supervisor) => ({
    key: crypto.randomUUID(),
    lecturerId: supervisor.lecturerId ?? "",
    name: supervisor.name,
    role: supervisor.role ?? "",
  }));
}

export function SupervisorEditor({
  supervisors,
  lecturers,
  errors,
  onChange,
  onMove,
  onRemove,
  onAdd,
}: {
  supervisors: SupervisorDraft[];
  lecturers: LecturerOption[];
  errors: FieldErrors;
  onChange: (index: number, patch: Partial<SupervisorDraft>) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Typography as="h3" variant="label" className="m-0">
            Supervisors
          </Typography>
          <Typography as="p" variant="caption" color="muted" className="mb-0 mt-1">
            Order is preserved on the public page. Link a lecturer directory profile when possible.
          </Typography>
        </div>
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="stroke"
          type="button"
          onClick={onAdd}
        >
          <RiAddLine className="size-3.5" />
          Add
        </AlignButton.Root>
      </div>
      {supervisors.map((supervisor, index) => {
        const lecturerValue = supervisor.lecturerId;
        const lecturerOptions = [
          { value: "", label: "No linked lecturer" },
          ...lecturers.map((lecturer) => ({ value: lecturer.id, label: lecturer.name })),
        ];
        if (lecturerValue && !lecturers.some((lecturer) => lecturer.id === lecturerValue)) {
          lecturerOptions.push({
            value: lecturerValue,
            label: `${supervisor.name || lecturerValue} (unavailable)`,
          });
        }
        return (
          <div
            key={supervisor.key}
            className="grid gap-3 rounded-10 border border-stroke-soft-200 p-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_140px_auto]"
          >
            <SelectField
              id={`supervisor-${index}-lecturer`}
              name={`supervisors.${index}.lecturerId`}
              label="Linked lecturer"
              value={lecturerValue}
              options={lecturerOptions}
              error={errors[`supervisors.${index}.lecturerId`]}
              onChange={(value) => {
                const selected = lecturers.find((lecturer) => lecturer.id === value);
                onChange(index, {
                  lecturerId: value,
                  name: supervisor.name || selected?.name || "",
                });
              }}
            />
            <AdminFormField
              id={`supervisor-${index}-name`}
              name={`supervisors.${index}.name`}
              label="Name"
              maxLength={200}
              placeholder="e.g. Dr. Nur Rokhman, S.Si., M.Kom."
              value={supervisor.name}
              error={errors[`supervisors.${index}.name`]}
              onChange={(value) => onChange(index, { name: value })}
            />
            <SelectField
              id={`supervisor-${index}-role`}
              name={`supervisors.${index}.role`}
              label="Role"
              value={supervisor.role}
              options={supervisorRoleOptions}
              error={errors[`supervisors.${index}.role`]}
              onChange={(value) =>
                onChange(index, { role: value === "main" || value === "co" ? value : "" })
              }
            />
            <div className="flex items-end justify-end gap-1 pb-0.5">
              <AlignButton.Root
                size="xxsmall"
                variant="neutral"
                mode="ghost"
                type="button"
                iconOnly
                aria-label={`Move supervisor ${index + 1} up`}
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
              >
                <RiArrowUpLine className="size-3.5" />
              </AlignButton.Root>
              <AlignButton.Root
                size="xxsmall"
                variant="neutral"
                mode="ghost"
                type="button"
                iconOnly
                aria-label={`Move supervisor ${index + 1} down`}
                disabled={index === supervisors.length - 1}
                onClick={() => onMove(index, 1)}
              >
                <RiArrowDownLine className="size-3.5" />
              </AlignButton.Root>
              <AlignButton.Root
                size="xxsmall"
                variant="error"
                mode="ghost"
                type="button"
                iconOnly
                aria-label={`Remove supervisor ${index + 1}`}
                disabled={supervisors.length === 1}
                onClick={() => onRemove(index)}
              >
                <RiDeleteBinLine className="size-3.5" />
              </AlignButton.Root>
            </div>
          </div>
        );
      })}
    </section>
  );
}
