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
import { Check as CheckIcon, Clear as ClearIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
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

export interface AutoCompleteProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "onSelect" | "defaultValue"
> {
  /**
   * Options to display.
   */
  options?: Array<AutoCompleteOption | CountryOption | string>;

  /**
   * Selected value(s).
   */
  value?: any;

  /**
   * Default value.
   */
  defaultValue?: any;

  /**
   * Change handler.
   */
  onChange?: (event: any, value: any, reason?: string, details?: any) => void;

  /**
   * Input value change handler.
   */
  onInputChange?: (event: any, value: string, reason?: string) => void;

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
  multiple?: boolean;

  /**
   * Show checkboxes in dropdown.
   * @default false
   */
  withCheckboxes?: boolean;

  /**
   * Allow custom values (free solo).
   * @default false
   */
  freeSolo?: boolean;

  /**
   * Disable clear button.
   * @default false
   */
  disableClearable?: boolean;

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
  groupBy?: string | ((option: any) => string);

  /**
   * Custom option renderer.
   */
  renderOption?: (props: any, option: any, state: AutocompleteRenderOptionState) => ReactNode;

  /**
   * Filter options function.
   */
  filterOptions?: (options: any[], state: { inputValue: string }) => any[];

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
  sx?: any;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const StyledAutocomplete = styled(MuiAutocomplete<any, boolean, boolean, boolean>)(({ theme }) => ({
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
}));

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
        <Typography variant="body2" sx={{ fontWeight: selected ? "fontWeightMedium" : "fontWeightRegular" }} noWrap>
          {option.label}
        </Typography>

        {showDescriptions && option.description && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.25 }}>
            {option.description}
          </Typography>
        )}

        {/* Dial code for country options */}
        {showFlags && isCountry && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
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
    options = [],
    value,
    onChange,
    onInputChange,
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
  const handleRenderOption = (props: any, option: any, state: AutocompleteRenderOptionState) => {
    if (customRenderOption) {
      if (customRenderOption.length >= 3) {
        return (customRenderOption as any)(props, option, state);
      }
      return (customRenderOption as any)(option, state);
    }

    return renderOptionContent({
      props,
      option: typeof option === "string" ? { value: option, label: option } : option,
      state,
      withCheckboxes: Boolean(multiple && withCheckboxes),
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
        label={label}
        placeholder={hasValue ? undefined : placeholder}
        helperText={errorText || helperText}
        error={isError}
        slotProps={{
          inputLabel: {
            ...params.slotProps?.inputLabel,
            shrink: false,
          },
          input: {
            ...params.slotProps?.input,
            startAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} /> : null}
                {params.slotProps?.input?.startAdornment}
              </>
            ),
          },
          htmlInput: {
            ...params.slotProps?.htmlInput,
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
  const handleRenderTags = (selectedOptions: any[]) => {
    const formattedOptions = selectedOptions.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt));
    if (formattedOptions.length <= maxDisplayedTags) {
      return formattedOptions.map((option) => (
        <Chip
          key={option.value ?? option.label ?? String(option)}
          label={option.label ?? String(option)}
          size="small"
          {...(!disableClearable
            ? {
                onDelete: () => {
                  // Handled by Autocomplete
                },
              }
            : {})}
        />
      ));
    }

    return [
      ...formattedOptions
        .slice(0, maxDisplayedTags)
        .map((option) => (
          <Chip
            key={option.value ?? option.label ?? String(option)}
            label={option.label ?? String(option)}
            size="small"
          />
        )),
      <Chip key="more" label={`+${formattedOptions.length - maxDisplayedTags}`} size="small" color="default" />,
    ];
  };

  return (
    <StyledAutocomplete
      ref={ref}
      options={options}
      getOptionLabel={(option: any) => (typeof option === "string" ? option : (option?.label ?? String(option ?? "")))}
      getOptionKey={(option: any) =>
        typeof option === "string" ? option : String(option?.value ?? option?.label ?? option)
      }
      value={value}
      onChange={(event, nextValue, reason, details) => onChange?.(event, nextValue, reason, details)}
      onInputChange={onInputChange}
      multiple={multiple}
      freeSolo={freeSolo}
      disableClearable={disableClearable}
      loading={loading}
      loadingText={loadingText}
      noOptionsText={noOptionsText}
      groupBy={
        typeof groupBy === "function" ? groupBy : groupBy ? (option: any) => String(option?.[groupBy] ?? "") : undefined
      }
      filterOptions={filterOptions as any}
      renderInput={handleRenderInput}
      renderOption={handleRenderOption as any}
      renderValue={multiple ? (handleRenderTags as never) : undefined}
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
