/**
 * AutoComplete Component for Dhriti UI
 * 
 * Enterprise-grade autocomplete component with:
 * - Combobox (single select)
 * - Country select with flags
 * - Controlled state management
 * - Free solo (custom values)
 * - Multiple values with badges
 * - Checkboxes for multi-select
 * - Async loading support
 * - Custom option rendering
 * - Grouped options
 * - Full theme integration
 * - Accessibility compliance
 */

"use client";

import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import MuiAutocomplete, {
  AutocompleteRenderInputParams,
  AutocompleteRenderOptionState,
} from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Check as CheckIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

export interface AutoCompleteOption {
  value: string | number;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
  group?: string;
}

export interface CountryOption extends AutoCompleteOption {
  code: string;
  dialCode: string;
  flag: string;
}

export interface AutoCompleteProps<
  Multiple extends boolean = false,
  DisableClearable extends boolean = false,
  FreeSolo extends boolean = false,
> extends Omit<
    HTMLAttributes<HTMLDivElement>,
  "onChange" | "onSelect" | "defaultValue"
  > {
  /**
   * Options to display.
   */
  options: AutoCompleteOption[] | CountryOption[];

  /**
   * Selected value(s).
   */
  value?: Multiple extends true ? AutoCompleteOption[] : AutoCompleteOption | string | null;

  /**
   * Change handler.
   */
  onChange?: (
    value: Multiple extends true ? AutoCompleteOption[] : AutoCompleteOption | string | null,
    option: Multiple extends true ? AutoCompleteOption[] : AutoCompleteOption | null
  ) => void;

  /**
   * Input label.
   */
  label?: ReactNode;

  /**
   * Input placeholder.
   */
  placeholder?: string;

  /**
   * Helper text.
   */
  helperText?: ReactNode;

  /**
   * Error text.
   */
  errorText?: ReactNode;

  /**
   * Enable multiple selection.
   * @default false
   */
  multiple?: Multiple;

  /**
   * Show checkboxes in dropdown.
   * @default false
   */
  withCheckboxes?: boolean;

  /**
   * Allow custom values (free solo).
   * @default false
   */
  freeSolo?: FreeSolo;

  /**
   * Disable clear button.
   * @default false
   */
  disableClearable?: DisableClearable;

  /**
   * Show loading state.
   * @default false
   */
  loading?: boolean;

  /**
   * Loading text.
   * @default "Loading..."
   */
  loadingText?: ReactNode;

  /**
   * No options text.
   * @default "No options"
   */
  noOptionsText?: ReactNode;

  /**
   * Group options by key.
   */
  groupBy?: string;

  /**
   * Custom option renderer.
   */
  renderOption?: (option: AutoCompleteOption, state: AutocompleteRenderOptionState) => ReactNode;

  /**
   * Filter options function.
   */
  filterOptions?: (options: AutoCompleteOption[], state: { inputValue: string }) => AutoCompleteOption[];

  /**
   * Show country flags (for CountryOption type).
   * @default false
   */
  showFlags?: boolean;

  /**
   * Show option descriptions.
   * @default true
   */
  showDescriptions?: boolean;

  /**
   * Show option icons.
   * @default true
   */
  showIcons?: boolean;

  /**
   * Limit selected options display.
   * @default 3
   */
  maxDisplayedTags?: number;

  /**
   * Custom input props.
   */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;

  /**
   * Disabled state.
   * @default false
   */
  disabled?: boolean;

  /**
   * Read-only state.
   * @default false
   */
  readOnly?: boolean;

  /**
   * Full width.
   * @default true
   */
  fullWidth?: boolean;

  /**
   * Custom CSS.
   */
  sx?: React.CSSProperties;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const StyledAutocomplete = styled(MuiAutocomplete<AutoCompleteOption, boolean, boolean, boolean>)(
  ({ theme }) => ({
  width: "100%",
  "& .MuiAutocomplete-clearIndicator": {
    marginRight: theme.spacing(0.5),
  },
  "& .MuiAutocomplete-popupIndicator": {
    marginRight: theme.spacing(0.5),
  },
  "& .MuiAutocomplete-option": {
    padding: theme.spacing(1.5, 2),
    minHeight: 48,
    "&[aria-selected='true']": {
      backgroundColor: theme.palette.action.selected,
      "&.Mui-focused": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },
  "& .MuiAutocomplete-paper": {
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[4],
    marginTop: theme.spacing(0.5),
  },
  "& .MuiChip-root": {
    margin: theme.spacing(0.25),
  },
  }),
);

// ============================================================================
// OPTION RENDERER
// ============================================================================

interface RenderOptionProps {
  props: any;
  option: AutoCompleteOption | CountryOption;
  state: AutocompleteRenderOptionState;
  withCheckboxes?: boolean;
  showFlags?: boolean;
  showDescriptions?: boolean;
  showIcons?: boolean;
}

const renderOptionContent = ({
  props,
  option,
  state,
  withCheckboxes = false,
  showFlags = false,
  showDescriptions = true,
  showIcons = true,
}: RenderOptionProps): ReactNode => {
  const { selected } = state;
  const isCountry = "flag" in option;

  return (
    <Box
      {...props}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.5,
        px: 2,
        width: "100%",
      }}
    >
      {/* Checkbox for multi-select */}
      {withCheckboxes && (
        <Checkbox
          checked={selected}
          size="small"
          icon={<CheckIcon fontSize="small" />}
          checkedIcon={<CheckIcon fontSize="small" />}
          sx={{
            ml: -0.5,
            color: "text.secondary",
          }}
        />
      )}

      {/* Flag for country options */}
      {showFlags && isCountry && (
        <Box
          sx={{
            fontSize: 20,
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {(option as CountryOption).flag}
        </Box>
      )}

      {/* Icon */}
      {showIcons && !isCountry && option.icon && (
        <Box
          sx={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          {option.icon}
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: selected ? "fontWeightMedium" : "fontWeightRegular" }}
          noWrap
        >
          {option.label}
        </Typography>

        {showDescriptions && option.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: "block", mt: 0.25 }}
          >
            {option.description}
          </Typography>
        )}

        {/* Dial code for country options */}
        {showFlags && isCountry && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.25 }}
          >
            {(option as CountryOption).dialCode}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AutoComplete = forwardRef<HTMLDivElement, AutoCompleteProps>(function AutoComplete(
  {
    options,
    value,
    onChange,
    label,
    placeholder,
    helperText,
    errorText,
    multiple = false,
    withCheckboxes = false,
    freeSolo = false,
    disableClearable = false,
    loading = false,
    loadingText = "Loading...",
    noOptionsText = "No options",
    groupBy,
    renderOption: customRenderOption,
    filterOptions,
    showFlags = false,
    showDescriptions = true,
    showIcons = true,
    maxDisplayedTags = 3,
    inputProps,
    disabled = false,
    readOnly = false,
    fullWidth = true,
    sx,
    ...props
  },
  ref,
) {
  const isError = Boolean(errorText);
  const hasValue = multiple ? Array.isArray(value) && value.length > 0 : Boolean(value);

  // Handle option rendering
  const handleRenderOption = (
    props: any,
    option: AutoCompleteOption | CountryOption,
    state: AutocompleteRenderOptionState,
  ) => {
    if (customRenderOption) {
      return customRenderOption(option, state);
    }

    return renderOptionContent({
      props,
      option,
      state,
      withCheckboxes: multiple && withCheckboxes,
      showFlags,
      showDescriptions,
      showIcons,
    });
  };

  // Handle input rendering
  const handleRenderInput = (params: AutocompleteRenderInputParams) => {
    return (
      <TextField
        id={params.id}
        placeholder={hasValue ? undefined : placeholder}
        helperText={errorText || helperText}
        error={isError}
        slotProps={{
          inputLabel: {
            ...params.slotProps.inputLabel,
            shrink: false,
          },
          input: {
            ...params.slotProps.input,
            startAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} />
                ) : null}
                {params.slotProps.input.startAdornment}
              </>
            ),
          },
          htmlInput: {
            ...params.slotProps.htmlInput,
            ...inputProps,
            readOnly,
          },
        }}
        disabled={disabled}
        fullWidth={fullWidth}
      />
    );
  };

  // Handle tag rendering for multi-select
  const handleRenderTags = (selectedOptions: AutoCompleteOption[]) => {
    if (selectedOptions.length <= maxDisplayedTags) {
      return selectedOptions.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          size="small"
          {...(!disableClearable ? {
            onDelete: () => {
              // Handled by Autocomplete
            },
          } : {})}
        />
      ));
    }

    return [
      ...selectedOptions.slice(0, maxDisplayedTags).map((option) => (
        <Chip key={option.value} label={option.label} size="small" />
      )),
      <Chip
        key="more"
        label={`+${selectedOptions.length - maxDisplayedTags}`}
        size="small"
        color="default"
      />,
    ];
  };

  return (
    <StyledAutocomplete
      ref={ref}
      options={options}
      getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
      getOptionKey={(option) => (typeof option === "string" ? option : String(option.value))}
      value={value}
      onChange={(_, nextValue) => onChange?.(nextValue as never, nextValue as never)}
      multiple={multiple}
      freeSolo={freeSolo}
      disableClearable={disableClearable}
      loading={loading}
      loadingText={loadingText}
      noOptionsText={noOptionsText}
      groupBy={groupBy ? (option) => String(option[groupBy as keyof AutoCompleteOption] ?? "") : undefined}
      filterOptions={filterOptions}
      renderInput={handleRenderInput}
      renderOption={handleRenderOption as any}
      renderValue={multiple ? handleRenderTags as never : undefined}
      clearIcon={<ClearIcon fontSize="small" />}
      popupIcon={<ExpandMoreIcon />}
      disabled={disabled}
      readOnly={readOnly}
      sx={[
        {
          "& .MuiOutlinedInput-root": {
            borderRadius: 1,
            boxShadow: "none",
            "&.Mui-focused": {
              boxShadow: "none",
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
});

AutoComplete.displayName = "AutoComplete";