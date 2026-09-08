/**
 * AutoComplete Component Stories
 * 
 * Comprehensive Storybook documentation for Dhriti AutoComplete component.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { AutoComplete } from "../src/components/mui";
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
} from "@mui/icons-material";

// Sample options
const simpleOptions = [
  { value: "react", label: "React", icon: <BusinessIcon />, description: "Frontend library" },
  { value: "angular", label: "Angular", icon: <BusinessIcon />, description: "Full framework" },
  { value: "vue", label: "Vue", icon: <BusinessIcon />, description: "Progressive framework" },
  { value: "svelte", label: "Svelte", icon: <BusinessIcon />, description: "Compiler-based" },
  { value: "next", label: "Next.js", icon: <WorkIcon />, description: "React framework" },
  { value: "nuxt", label: "Nuxt", icon: <WorkIcon />, description: "Vue framework" },
];

const groupedOptions = [
  { value: "frontend", label: "Frontend", group: "Web Development" },
  { value: "backend", label: "Backend", group: "Web Development" },
  { value: "fullstack", label: "Full Stack", group: "Web Development" },
  { value: "mobile", label: "Mobile", group: "App Development" },
  { value: "desktop", label: "Desktop", group: "App Development" },
  { value: "design", label: "Design", group: "Creative" },
  { value: "pm", label: "Product Management", group: "Management" },
];

const countryOptions = [
  { value: "us", label: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { value: "uk", label: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { value: "ca", label: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { value: "au", label: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { value: "in", label: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { value: "de", label: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { value: "fr", label: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { value: "jp", label: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { value: "cn", label: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { value: "br", label: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
];

const meta = {
  title: "Form Elements/AutoComplete",
  component: AutoComplete,

  parameters: {
    layout: "padded",
  },

  decorators: [
    (Story) => (
      <div style={{ width: "min(100%, 480px)" }}>
        <Story />
      </div>
    ),
  ],

  args: {
    label: "Select option",
    placeholder: "Search...",
    options: simpleOptions,
    fullWidth: true,
  },

  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    helperText: { control: "text" },
    errorText: { control: "text" },
    multiple: { control: "boolean" },
    withCheckboxes: { control: "boolean" },
    freeSolo: { control: "boolean" },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    showFlags: { control: "boolean" },
    showDescriptions: { control: "boolean" },
    showIcons: { control: "boolean" },
    options: { control: false },
    value: { control: false },
    onChange: { control: false },
  },
} satisfies Meta<typeof AutoComplete>;

export default meta;

type Story = StoryObj<typeof meta>;

// ============================================================================
// COMBOBOX
// ============================================================================

/**
 * Basic combobox (single select).
 */
export const Combobox: Story = {
  name: "Combobox",
  args: {
    label: "Select framework",
    placeholder: "Search frameworks...",
    options: simpleOptions,
    showIcons: true,
    showDescriptions: true,
  },
};

/**
 * Combobox with grouped options.
 */
export const ComboboxGrouped: Story = {
  name: "Combobox (Grouped)",
  args: {
    label: "Select role",
    placeholder: "Search roles...",
    options: groupedOptions,
    groupBy: "group",
  },
};

/**
 * Combobox with loading state.
 */
export const ComboboxLoading: Story = {
  name: "Combobox (Loading)",
  args: {
    label: "Search users",
    placeholder: "Type to search...",
    options: [],
    loading: true,
    loadingText: "Searching...",
    noOptionsText: "No users found",
  },
};

/**
 * Combobox with error.
 */
export const ComboboxError: Story = {
  name: "Combobox (Error)",
  args: {
    label: "Select option",
    placeholder: "Search...",
    options: simpleOptions,
    errorText: "This field is required",
  },
};

// ============================================================================
// COUNTRY SELECT
// ============================================================================

/**
 * Country select with flags.
 */
export const CountrySelect: Story = {
  name: "Country Select",
  args: {
    label: "Select country",
    placeholder: "Search countries...",
    options: countryOptions,
    showFlags: true,
    showDescriptions: true,
  },
};

/**
 * Country select with helper text.
 */
export const CountrySelectWithHelper: Story = {
  name: "Country Select (With Helper)",
  args: {
    label: "Country of residence",
    placeholder: "Search countries...",
    options: countryOptions,
    showFlags: true,
    helperText: "Select your primary country",
  },
};

/**
 * Country select all.
 */
export const CountrySelectAll: Story = {
  name: "Country Select (All)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 400 }}>
      <AutoComplete
        label="Select country"
        placeholder="Search..."
        options={countryOptions}
        showFlags
        showDescriptions
      />
      <AutoComplete
        label="Shipping country"
        placeholder="Search..."
        options={countryOptions}
        showFlags
        helperText="Where should we ship?"
      />
    </div>
  ),
};

// ============================================================================
// CONTROLLED STATE
// ============================================================================

/**
 * Controlled combobox.
 */
export const ControlledState: Story = {
  name: "Controlled State",
  render: () => {
    const [value, setValue] = useState<typeof simpleOptions[0] | null>(null);

    return (
      <div style={{ width: 400 }}>
        <AutoComplete
          label="Controlled Select"
          placeholder="Select framework..."
          options={simpleOptions}
          value={value}
          onChange={(_, newValue) => setValue(newValue)}
          showIcons
          showDescriptions
          helperText={`Selected: ${value?.label || "None"}`}
        />
      </div>
    );
  },
};

/**
 * Controlled with external reset.
 */
export const ControlledWithReset: Story = {
  name: "Controlled (With Reset)",
  render: () => {
    const [value, setValue] = useState<typeof simpleOptions[0] | null>(null);

    return (
      <div style={{ width: 400 }}>
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setValue(null)}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Reset Selection
          </button>
        </div>
        <AutoComplete
          label="Controlled Select"
          placeholder="Select framework..."
          options={simpleOptions}
          value={value}
          onChange={(_, newValue) => setValue(newValue)}
          showIcons
          showDescriptions
        />
      </div>
    );
  },
};

// ============================================================================
// FREE SOLO
// ============================================================================

/**
 * Free solo (custom values).
 */
export const FreeSolo: Story = {
  name: "Free Solo",
  args: {
    label: "Enter technology",
    placeholder: "Type or select...",
    options: simpleOptions,
    freeSolo: true,
    helperText: "You can type custom values",
  },
};

/**
 * Free solo with tags.
 */
export const FreeSoloWithTags: Story = {
  name: "Free Solo (With Tags)",
  render: () => {
    const [tags, setTags] = useState<string[]>(["React", "TypeScript"]);

    return (
      <div style={{ width: 400 }}>
        <AutoComplete
          label="Add tags"
          placeholder="Type and press Enter..."
          options={simpleOptions.map((o) => o.label)}
          value={tags}
          onChange={(_, newValue) => setTags(newValue as string[])}
          freeSolo
          multiple
          helperText="Press Enter to add tags"
        />
      </div>
    );
  },
};

// ============================================================================
// MULTIPLE VALUES
// ============================================================================

/**
 * Multiple select.
 */
export const MultipleValues: Story = {
  name: "Multiple Values",
  args: {
    label: "Select frameworks",
    placeholder: "Search frameworks...",
    options: simpleOptions,
    multiple: true,
    showIcons: true,
    showDescriptions: true,
  },
};

/**
 * Multiple with limited display.
 */
export const MultipleLimited: Story = {
  name: "Multiple (Limited Display)",
  args: {
    label: "Select frameworks",
    placeholder: "Search frameworks...",
    options: simpleOptions,
    multiple: true,
    showIcons: true,
    showDescriptions: true,
    maxDisplayedTags: 2,
  },
};

/**
 * Multiple with all options selected.
 */
export const MultipleAllSelected: Story = {
  name: "Multiple (All Selected)",
  render: () => (
    <div style={{ width: 400 }}>
      <AutoComplete
        label="Select frameworks"
        placeholder="Search frameworks..."
        options={simpleOptions}
        multiple
        value={simpleOptions}
        showIcons
        showDescriptions
        helperText={`${simpleOptions.length} frameworks selected`}
      />
    </div>
  ),
};

// ============================================================================
// CHECKBOXES
// ============================================================================

/**
 * Multiple with checkboxes.
 */
export const Checkboxes: Story = {
  name: "Checkboxes",
  args: {
    label: "Select frameworks",
    placeholder: "Search frameworks...",
    options: simpleOptions,
    multiple: true,
    withCheckboxes: true,
    showIcons: true,
    showDescriptions: true,
  },
};

/**
 * Checkboxes with grouped options.
 */
export const CheckboxesGrouped: Story = {
  name: "Checkboxes (Grouped)",
  args: {
    label: "Select roles",
    placeholder: "Search roles...",
    options: groupedOptions,
    multiple: true,
    withCheckboxes: true,
    groupBy: "group",
  },
};

/**
 * Checkboxes all.
 */
export const CheckboxesAll: Story = {
  name: "Checkboxes (All)",
  render: () => (
    <div style={{ width: 400 }}>
      <AutoComplete
        label="Select frameworks"
        placeholder="Search frameworks..."
        options={simpleOptions}
        multiple
        withCheckboxes
        showIcons
        showDescriptions
        helperText="Select all that apply"
      />
    </div>
  ),
};

// ============================================================================
// ADVANCED PATTERNS
// ============================================================================

/**
 * Async loading simulation.
 */
export const AsyncLoading: Story = {
  name: "Async Loading",
  render: () => {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<typeof simpleOptions>([]);

    const handleSearch = async (inputValue: string) => {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOptions(simpleOptions.filter((o) =>
        o.label.toLowerCase().includes(inputValue.toLowerCase())
      ));
      setLoading(false);
    };

    return (
      <div style={{ width: 400 }}>
        <AutoComplete
          label="Search frameworks"
          placeholder="Type to search..."
          options={options}
          loading={loading}
          loadingText="Searching..."
          noOptionsText="No frameworks found"
          onInputChange={(_, value) => {
            if (value) handleSearch(value);
          }}
          showIcons
          showDescriptions
        />
      </div>
    );
  },
};

/**
 * Custom option rendering.
 */
export const CustomRendering: Story = {
  name: "Custom Rendering",
  render: () => (
    <div style={{ width: 400 }}>
      <AutoComplete
        label="Select team member"
        placeholder="Search members..."
        options={[
          { value: "1", label: "John Doe", description: "Frontend Developer", icon: <PersonIcon /> },
          { value: "2", label: "Jane Smith", description: "Backend Developer", icon: <PersonIcon /> },
          { value: "3", label: "Bob Johnson", description: "Designer", icon: <PersonIcon /> },
        ]}
        renderOption={(props, option, state) => (
          <Box
            {...props}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: 2,
              px: 3,
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-child": {
                borderBottom: "none",
              },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              {option.label.charAt(0)}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={state.selected ? 600 : 400}>
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.description}
              </Typography>
            </Box>
            {state.selected && (
              <CheckIcon color="primary" fontSize="small" />
            )}
          </Box>
        )}
      />
    </div>
  ),
};

/**
 * Enterprise patterns.
 */
export const EnterprisePatterns: Story = {
  name: "Enterprise Patterns",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 400 }}>
      {/* Department select */}
      <AutoComplete
        label="Department"
        placeholder="Select department..."
        options={[
          { value: "eng", label: "Engineering", icon: <BusinessIcon /> },
          { value: "design", label: "Design", icon: <SchoolIcon /> },
          { value: "sales", label: "Sales", icon: <WorkIcon /> },
        ]}
        showIcons
        showDescriptions
      />

      {/* Country select */}
      <AutoComplete
        label="Office Location"
        placeholder="Select country..."
        options={countryOptions}
        showFlags
        helperText="Primary office location"
      />

      {/* Multi-select with checkboxes */}
      <AutoComplete
        label="Skills"
        placeholder="Search skills..."
        options={[
          { value: "react", label: "React", description: "Frontend" },
          { value: "node", label: "Node.js", description: "Backend" },
          { value: "python", label: "Python", description: "Backend" },
          { value: "design", label: "Design", description: "Creative" },
        ]}
        multiple
        withCheckboxes
        showDescriptions
        helperText="Select all relevant skills"
      />
    </div>
  ),
};