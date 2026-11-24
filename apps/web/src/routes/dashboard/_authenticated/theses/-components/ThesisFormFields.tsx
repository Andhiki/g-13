import {
  Select,
  SelectEmpty,
  SelectGroup,
  SelectGroupLabel,
  SelectInput,
  SelectList,
} from "@ui-sdk/react/select";
import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import {
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

const fieldControlClass =
  "block min-h-9 w-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-base text-text-strong-950 placeholder:text-text-sub-600 focus:border-stroke-strong-950 focus:outline-none sm:text-paragraph-sm";

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
  const groups = new Map<string, FieldOption[]>();
  for (const field of fields) {
    const group = groups.get(field.lab) ?? [];
    group.push(field);
    groups.set(field.lab, group);
  }
  const errorId = "thesis-fields-error";
  return (
    <div>
      <Select
        name="fieldIds"
        multiple
        itemToLabel={(id) => fields.find((field) => field.id === id)?.name ?? id}
        value={selected}
        onValueChange={onChange}
        placeholder="Choose sub-labs"
      >
        <ThesisSelectTrigger
          aria-labelledby="thesis-fields-heading"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="w-full"
        />
        <ThesisSelectContent>
          <SelectInput
            aria-label="Search sub-labs"
            placeholder="Search sub-labs"
            className={fieldControlClass}
          />
          <SelectEmpty className="p-2 text-text-sub-600">No matching sub-labs</SelectEmpty>
          <SelectList>
            {Array.from(groups, ([lab, options]) => (
              <SelectGroup key={lab}>
                <SelectGroupLabel className="px-2 py-1 text-label-xs text-text-sub-600">
                  {lab}
                </SelectGroupLabel>
                {options.map((field) => (
                  <ThesisSelectItem key={field.id} value={field.id} label={field.name} />
                ))}
              </SelectGroup>
            ))}
          </SelectList>
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
      <div>
        <Typography as="h3" id="thesis-fields-heading" variant="label" className="m-0">
          Sub-labs
        </Typography>
        <Typography as="p" variant="caption" color="muted" className="mb-0 mt-1">
          Optional. Select any sub-labs that apply.
        </Typography>
      </div>
      <FieldMultiSelect fields={fields} selected={selected} error={error} onChange={onChange} />
    </section>
  );
}
