import { Select } from "@ui-sdk/react/select";
import { RiCloseLine } from "@remixicon/react";
import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import {
  ThesisFieldOptions,
  ThesisSelectContent,
  ThesisSelectItem,
  ThesisSelectTrigger,
} from "@/routes/_public/theses/-components/ThesisSelect";
import { Typography } from "@/ui/typography";
import {
  thesisContactChannelSchema,
  thesisLanguageSchema,
  thesisStatusSchema,
  thesisTypeSchema,
} from "../-shared/schemas";

export type LecturerOption = { id: string; name: string };
export type FieldOption = { id: string; name: string; lab: string };
export type SupervisorDraft = {
  key: string;
  lecturerId: string;
  name: string;
  role: "main" | "co" | "";
};
export type FieldErrors = Record<string, string | undefined>;

export const typeOptions = thesisTypeSchema.options.map((value) => ({
  value,
  label:
    value === "skripsi"
      ? "Skripsi"
      : value === "product-innovation"
        ? "Product innovation"
        : value === "collaborative-project"
          ? "Collaborative project"
          : value === "industry-project"
            ? "Industry project"
            : "Scientific publication",
}));

export const languageOptions = thesisLanguageSchema.options.map((value) => ({
  value,
  label: value === "id" ? "Indonesian" : "English",
}));

export const statusOptions = thesisStatusSchema.options.map((value) => ({
  value,
  label: value === "draft" ? "Draft" : value === "published" ? "Published" : "Hidden",
}));

export const supervisorRoleOptions = [
  { value: "", label: "Not specified" },
  { value: "main", label: "Main supervisor" },
  { value: "co", label: "Co-supervisor" },
];

export const contactChannelOptions = [
  { value: "none", label: "No public contact" },
  ...thesisContactChannelSchema.options.map((value) => ({
    value,
    label: value === "email" ? "Email" : "URL",
  })),
];

export function SelectField({
  id,
  name,
  label,
  value,
  options,
  error,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  error?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <Typography
        as="label"
        variant="labelSmall"
        color="strong"
        htmlFor={id}
        className="mb-1.5 block"
      >
        {label}
      </Typography>
      <Select
        name={name}
        value={value}
        items={options}
        onValueChange={(next) => onChange(next ?? "")}
      >
        <ThesisSelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="w-full"
        />
        <ThesisSelectContent>
          {options.map((option) => (
            <ThesisSelectItem key={option.value} {...option} />
          ))}
        </ThesisSelectContent>
      </Select>
      {error && (
        <Typography variant="caption" color="danger" id={errorId} className="mt-1.5">
          {error}
        </Typography>
      )}
    </div>
  );
}

export function SwitchField({
  id,
  label,
  description,
  checked,
  error,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  error?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-10 border border-stroke-soft-200 p-3">
      <div className="min-w-0">
        <Typography as="label" htmlFor={id} variant="labelSmall" color="strong">
          {label}
        </Typography>
        <Typography
          as="p"
          id={`${id}-description`}
          variant="caption"
          color="muted"
          className="mb-0 mt-1"
        >
          {description}
        </Typography>
        {error && (
          <Typography id={`${id}-error`} variant="caption" color="danger" className="mt-1">
            {error}
          </Typography>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        aria-invalid={Boolean(error)}
        className="group/switch h-5 w-8 shrink-0 rounded-full bg-bg-soft-200 p-0.5 focus-visible:outline-2 focus-visible:outline-primary-base data-checked:bg-primary-base"
        aria-describedby={error ? `${id}-description ${id}-error` : `${id}-description`}
        onCheckedChange={onCheckedChange}
      >
        <SwitchThumb className="block size-4 rounded-full bg-static-white shadow-switch-thumb transition-transform group-data-checked/switch:translate-x-3" />
      </Switch>
    </div>
  );
}

function FieldMultiSelect({
  fields,
  selected,
  error,
  onChange,
}: {
  fields: FieldOption[];
  selected: string[];
  error?: string;
  onChange: (fieldIds: string[]) => void;
}) {
  const errorId = "thesis-fields-error";
  return (
    <div>
      <Select
        name="fieldIds"
        multiple
        itemToLabel={(id) => fields.find((field) => field.id === id)?.name ?? id}
        value={selected}
        onValueChange={onChange}
        placeholder="None selected"
      >
        <ThesisSelectTrigger
          aria-labelledby="thesis-fields-heading"
          valueLabel={selected.length ? `${selected.length} selected` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="w-full"
        />
        <ThesisFieldOptions
          fields={fields}
          searchLabel="Search sub-labs"
          emptyLabel="No matching sub-labs"
          multiple
        />
      </Select>
      {selected.length > 0 && (
        <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
          {selected.map((id) => {
            const label = fields.find((field) => field.id === id)?.name ?? id;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  className="inline-flex items-center gap-1 rounded-md bg-bg-weak-50 px-2 py-1 text-label-xs hover:bg-bg-soft-200 focus-visible:outline-2 focus-visible:outline-primary-base"
                  onClick={() => onChange(selected.filter((value) => value !== id))}
                >
                  {label}
                  <RiCloseLine aria-hidden="true" className="size-3.5 shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <Typography variant="caption" color="danger" id={errorId} className="mt-1.5">
          {error}
        </Typography>
      )}
    </div>
  );
}

export function FieldsSection({
  fields,
  selected,
  error,
  onChange,
}: {
  fields: FieldOption[];
  selected: string[];
  error?: string;
  onChange: (fieldIds: string[]) => void;
}) {
  return (
    <section className="space-y-3">
      <Typography as="h3" id="thesis-fields-heading" variant="label" className="m-0">
        Sub-labs (optional)
      </Typography>
      <FieldMultiSelect fields={fields} selected={selected} error={error} onChange={onChange} />
    </section>
  );
}
