"use client";

import * as React from "react";
import {
  Autocomplete,
  Button as MuiButton,
  Checkbox as MuiCheckbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Radio as MuiRadio,
  RadioGroup as MuiRadioGroup,
  Rating as MuiRating,
  Select as MuiSelect,
  Slider as MuiSlider,
  Switch as MuiSwitch,
  TextField as MuiTextField,
  TextareaAutosize,
  ToggleButton as MuiToggleButton,
  ToggleButtonGroup as MuiToggleButtonGroup,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

export const Button = styled(MuiButton)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 700,
  letterSpacing: 0.01,
  padding: "0.72rem 1.2rem",
  boxShadow: "none",
  transition: "transform 120ms ease, box-shadow 120ms ease",
  "&:hover": {
    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.18)}`,
    transform: "translateY(-1px)",
  },
  "&.MuiButton-containedPrimary": {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
    color: theme.palette.primary.contrastText ?? "#212121",
  },
}));

export const TextField = styled(MuiTextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transition: "border-color 120ms ease, box-shadow 120ms ease",
    "& fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.18),
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.35),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
    },
  },
}));

export const NumberField = styled(MuiTextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.03),
    "& fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.18),
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.32),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  },
}));

export const Select = styled(MuiSelect)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: alpha(theme.palette.primary.main, 0.18),
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: alpha(theme.palette.primary.main, 0.32),
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
  },
}));

export const Checkbox = styled(MuiCheckbox)(({ theme }) => ({
  color: alpha(theme.palette.primary.main, 0.8),
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
}));

export const Radio = styled(MuiRadio)(({ theme }) => ({
  color: alpha(theme.palette.primary.main, 0.8),
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
}));

export const RadioGroup = MuiRadioGroup;

export const Switch = styled(MuiSwitch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: theme.palette.primary.main,
    "& + .MuiSwitch-track": {
      backgroundColor: alpha(theme.palette.primary.main, 0.8),
      opacity: 1,
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "none",
  },
}));

export const Slider = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.primary.main,
  height: 6,
  "& .MuiSlider-thumb": {
    width: 16,
    height: 16,
    backgroundColor: theme.palette.background.paper,
    border: `2px solid ${theme.palette.primary.main}`,
  },
  "& .MuiSlider-rail": {
    opacity: 1,
    backgroundColor: alpha(theme.palette.primary.main, 0.18),
  },
  "& .MuiSlider-track": {
    border: "none",
  },
}));

export const Rating = styled(MuiRating)(({ theme }) => ({
  "& .MuiRating-iconFilled": {
    color: theme.palette.primary.main,
  },
  "& .MuiRating-iconHover": {
    color: alpha(theme.palette.primary.main, 0.9),
  },
}));

export const ToggleButtonGroup = styled(MuiToggleButtonGroup)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  "& .MuiToggleButtonGroup-grouped": {
    border: "none",
    color: theme.palette.text.secondary,
    "&.Mui-selected": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      color: theme.palette.primary.main,
      fontWeight: 700,
    },
  },
}));

export const ToggleButton = MuiToggleButton;
export const AutocompleteField = Autocomplete;
export const Combobox = Autocomplete;
export const TextAreaAutosize = styled(TextareaAutosize)(({ theme }) => ({
  width: "100%",
  minHeight: 110,
  padding: "0.88rem 0.95rem",
  borderRadius: theme.tokens.radius.md,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.03),
  color: theme.palette.text.primary,
  resize: "vertical",
  font: "inherit",
  transition: "border-color 120ms ease, box-shadow 120ms ease",
  "&:focus": {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
    outline: "none",
  },
}));

export type DateTimePickerProps = React.ComponentProps<typeof MuiDateTimePicker>;

export function DateTimePicker(props: DateTimePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDateTimePicker {...props} />
    </LocalizationProvider>
  );
}

export { FormControl, FormControlLabel, InputAdornment, MenuItem };
export const NumberInputAdornment = InputAdornment;
