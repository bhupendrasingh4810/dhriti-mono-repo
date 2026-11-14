import { useState } from "react";
import { Hash, Lock, Mail, Search, User } from "lucide-react";
import {
  DhritiComboboxFlat,
  DhritiComboboxGrouped,
  DhritiComboboxHierarchy,
  DhritiCountryField,
  DhritiEmailField,
  DhritiFieldGroup,
  DhritiNumberField,
  DhritiPasswordField,
  DhritiPhoneField,
  DhritiSelectMenu,
  DhritiTextField,
  type CountryOption,
  type FieldOptionGroup,
  type FieldPresentationProps,
} from "../src/components/fields";

// Reference data belongs to the Storybook parent, never to the reusable fields.
export const countries: CountryOption[] = [
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
];
const apps = [
  { value: "connect", label: "Dhriti Connect", icon: "💬" },
  { value: "flow", label: "Dhriti Flow", icon: "⚡" },
  { value: "nexus", label: "Dhriti Nexus", icon: "📚" },
  { value: "pulse", label: "Dhriti Pulse", icon: "📊" },
  { value: "atlas", label: "Dhriti Atlas", icon: "🗺️" },
];
const departments: FieldOptionGroup[] = [
  {
    value: "engineering",
    label: "Engineering",
    options: [
      { value: "frontend", label: "Frontend" },
      { value: "backend", label: "Backend" },
      { value: "devops", label: "DevOps" },
    ],
  },
  {
    value: "design",
    label: "Design",
    options: [
      { value: "product", label: "Product Design" },
      { value: "brand", label: "Brand & Visual" },
    ],
  },
  {
    value: "operations",
    label: "Operations",
    options: [
      { value: "hr", label: "Human Resources" },
      { value: "finance", label: "Finance" },
    ],
  },
];
const members: FieldOptionGroup[] = [
  {
    value: "engineering",
    label: "Engineering",
    options: [
      { value: "alex", label: "Alex Morgan", description: "Frontend Engineer" },
      { value: "sam", label: "Sam Taylor", description: "Backend Engineer" },
    ],
  },
  {
    value: "design",
    label: "Design",
    options: [
      { value: "jordan", label: "Jordan Lee", description: "Product Designer" },
      { value: "casey", label: "Casey Chen", description: "UX Researcher" },
    ],
  },
];
const jobs = [
  "Software Engineer",
  "Product Designer",
  "Product Manager",
  "Data Analyst",
  "DevOps Engineer",
  "QA Engineer",
  "HR Manager",
  "Marketing Specialist",
];

export type FieldKind =
  "text" | "number" | "phone" | "country" | "email" | "password" | "select" | "flat" | "hierarchy" | "grouped";
export interface FieldDemoProps extends Pick<
  FieldPresentationProps,
  "size" | "variant" | "showLabel" | "required" | "disabled" | "readOnly" | "error" | "success" | "clearable"
> {
  kind: FieldKind;
  showHelper?: boolean;
  showPlaceholder?: boolean;
  showStartIcon?: boolean;
  showEndIcon?: boolean;
  prefilled?: boolean;
  emptyOptions?: boolean;
  longContent?: boolean;
}

export const fieldDemoArgs = {
  size: "md",
  variant: "outlined",
  showLabel: true,
  showHelper: true,
  showPlaceholder: true,
  required: false,
  disabled: false,
  readOnly: false,
  success: false,
  clearable: true,
  showStartIcon: true,
  showEndIcon: false,
  prefilled: false,
  emptyOptions: false,
  longContent: false,
} satisfies Omit<FieldDemoProps, "kind">;
export const fieldArgTypes = {
  size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  variant: { control: "inline-radio", options: ["outlined", "filled", "underline"] },
  error: { control: "text" },
} as const;

const content: Record<
  FieldKind,
  { label: string; placeholder: string; helper: string; title: string; description: string }
> = {
  text: {
    label: "Full name",
    placeholder: "e.g. Alex Morgan",
    helper: "Enter your full name as it appears on your ID",
    title: "Text field",
    description: "Single-line text input with optional icons and clear action.",
  },
  number: {
    label: "Seat count",
    placeholder: "0",
    helper: "Number of licensed seats (1–999)",
    title: "Number field",
    description: "Numeric input with increment / decrement stepper controls.",
  },
  phone: {
    label: "Phone number",
    placeholder: "98765 43210",
    helper: "Include country code for international numbers",
    title: "Phone field",
    description: "Country code selector with flag and searchable dropdown.",
  },
  country: {
    label: "Country",
    placeholder: "Select a country",
    helper: "Select your country of residence",
    title: "Country field",
    description: "Searchable country picker with flag icons.",
  },
  email: {
    label: "Work email",
    placeholder: "you@company.com",
    helper: "We'll send a verification link to this address",
    title: "Email field",
    description: "Email input with parent-controlled validation feedback.",
  },
  password: {
    label: "Password",
    placeholder: "Enter password",
    helper: "Minimum 8 characters with uppercase, number, and symbol",
    title: "Password field",
    description: "Show / hide toggle and a parent-provided strength indicator.",
  },
  select: {
    label: "Job title",
    placeholder: "Select a job title",
    helper: "Choose the title that best describes your role",
    title: "Select menu",
    description: "Single-select dropdown with custom-styled menu.",
  },
  flat: {
    label: "Applications",
    placeholder: "Select applications...",
    helper: "Select the Dhriti apps you want to enable",
    title: "A · Checkbox list",
    description: "Searchable multiselect with removable chips.",
  },
  hierarchy: {
    label: "Department",
    placeholder: "Select departments...",
    helper: "Select teams within your organization",
    title: "B · Hierarchy / tree",
    description: "Expandable groups with mixed selection and child chips.",
  },
  grouped: {
    label: "Team members",
    placeholder: "Select members...",
    helper: "Add members to your workspace",
    title: "C · Grouped with headings",
    description: "Grouped options with avatars and member descriptions.",
  },
};

export function FieldDemo({
  kind,
  showHelper,
  showPlaceholder,
  showStartIcon,
  showEndIcon,
  prefilled,
  emptyOptions,
  longContent,
  ...args
}: FieldDemoProps) {
  const initial =
    kind === "number"
      ? "10"
      : kind === "email"
        ? "alex@dhriti.example"
        : kind === "phone"
          ? "98765 43210"
          : kind === "password"
            ? "DhritiDemo123!"
            : "Alex Morgan";
  const [value, setValue] = useState(prefilled ? initial : "");
  const [selection, setSelection] = useState<string | null>(prefilled ? (kind === "country" ? "IN" : jobs[0]) : null);
  const [selected, setSelected] = useState<string[]>(
    prefilled
      ? kind === "flat"
        ? ["connect", "flow"]
        : kind === "hierarchy"
          ? ["frontend", "backend"]
          : ["alex", "sam"]
      : [],
  );
  const [countryCode, setCountryCode] = useState<string | null>("IN");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>(["engineering"]);
  const [visible, setVisible] = useState(false);
  const copy = content[kind];
  const icon =
    kind === "text" ? (
      <User className="size-4" />
    ) : kind === "number" ? (
      <Hash className="size-4" />
    ) : kind === "email" ? (
      <Mail className="size-4" />
    ) : kind === "password" ? (
      <Lock className="size-4" />
    ) : undefined;
  const props: FieldPresentationProps = {
    ...args,
    label: copy.label,
    placeholder: showPlaceholder ? copy.placeholder : undefined,
    helperText: showHelper ? copy.helper : undefined,
    successText: showHelper ? undefined : "",
    startIcon: showStartIcon ? icon : undefined,
    endIcon: showEndIcon ? <Search className="size-4" /> : undefined,
  };
  const menu = {
    open,
    onOpenChange: (next: boolean) => {
      setOpen(next);
      if (!next) setSearch("");
    },
  };
  const text = { ...props, value, onChange: setValue };
  const multi = { ...props, ...menu, value: selected, onChange: setSelected };
  const flatOptions = emptyOptions
    ? []
    : apps.map((option) => ({
        ...option,
        label: longContent
          ? `${option.label} — workspace configuration and organization collaboration tools`
          : option.label,
      }));
  const groupOptions = emptyOptions
    ? []
    : (kind === "hierarchy" ? departments : members).map((group) => ({
        ...group,
        options: group.options.map((option) => ({
          ...option,
          label: longContent
            ? `${option.label} — international product operations and cross-functional collaboration`
            : option.label,
        })),
      }));
  const strength =
    value.length === 0
      ? 0
      : Math.min(
          4,
          (value.length >= 8 ? 1 : 0) +
            (/[A-Z]/.test(value) ? 1 : 0) +
            (/[0-9]/.test(value) ? 1 : 0) +
            (/[^A-Za-z0-9]/.test(value) ? 1 : 0),
        );
  const strengthProps =
    strength === 4
      ? ({ score: 4, label: "Strong", tone: "brand" } as const)
      : strength === 3
        ? ({ score: 3, label: "Good", tone: "info" } as const)
        : strength === 2
          ? ({ score: 2, label: "Fair", tone: "warning" } as const)
          : ({ score: strength === 0 ? 0 : 1, label: "Weak", tone: "error" } as const);
  return (
    <>
      {kind === "text" && <DhritiTextField {...text} />}
      {kind === "number" && <DhritiNumberField {...text} min={1} max={999} />}
      {kind === "email" && <DhritiEmailField {...text} />}
      {kind === "password" && (
        <DhritiPasswordField
          {...text}
          visible={visible}
          onVisibleChange={setVisible}
          strength={value ? strengthProps : undefined}
        />
      )}
      {kind === "phone" && (
        <DhritiPhoneField
          {...text}
          {...menu}
          countries={emptyOptions ? [] : countries}
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          search={search}
          onSearchChange={setSearch}
        />
      )}
      {kind === "country" && (
        <DhritiCountryField
          {...props}
          {...menu}
          value={selection}
          onChange={setSelection}
          countries={emptyOptions ? [] : countries}
          search={search}
          onSearchChange={setSearch}
        />
      )}
      {kind === "select" && (
        <DhritiSelectMenu
          {...props}
          {...menu}
          value={selection}
          onChange={setSelection}
          options={
            emptyOptions
              ? []
              : jobs.map((label) => ({
                  value: label,
                  label: longContent ? `${label} — Global Connect and Flow Platform Operations` : label,
                }))
          }
        />
      )}
      {kind === "flat" && (
        <DhritiComboboxFlat {...multi} options={flatOptions} search={search} onSearchChange={setSearch} />
      )}
      {kind === "hierarchy" && (
        <DhritiComboboxHierarchy {...multi} groups={groupOptions} expanded={expanded} onExpandedChange={setExpanded} />
      )}
      {kind === "grouped" && <DhritiComboboxGrouped {...multi} groups={groupOptions} />}
    </>
  );
}

export function FieldStory(props: FieldDemoProps) {
  return (
    <div className="w-full max-w-md p-6">
      <FieldDemo key={`${props.kind}-${props.prefilled}`} {...props} />
    </div>
  );
}

export function FieldGallery(args: Omit<FieldDemoProps, "kind">) {
  const basics: FieldKind[] = ["text", "number", "phone", "country", "email", "password", "select"];
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="font-display text-2xl font-bold text-text-primary">Input fields</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Fully controlled fields using the Dhriti theme. Configure appearance with Storybook controls.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {basics.map((kind) => (
            <DhritiFieldGroup key={kind} title={content[kind].title} description={content[kind].description}>
              <FieldDemo key={`${kind}-${args.prefilled}`} {...args} kind={kind} />
            </DhritiFieldGroup>
          ))}
        </div>
        <DhritiFieldGroup
          title="Combobox"
          description="Three multiselect patterns with parent-owned selection and menu state."
          wide
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {(["flat", "hierarchy", "grouped"] as const).map((kind) => (
              <div key={kind}>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand">{content[kind].title}</p>
                <FieldDemo key={`${kind}-${args.prefilled}`} {...args} kind={kind} />
              </div>
            ))}
          </div>
        </DhritiFieldGroup>
      </div>
    </div>
  );
}
