"use client";

import { useState, type ChangeEvent } from "react";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { IconButton, InputAdornment, TextField, type TextFieldProps } from "@mui/material";

export interface PasswordFieldProps extends Omit<TextFieldProps, "type" | "value" | "onChange"> {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function PasswordField({
  value,
  onChange,
  label = "Password",
  autoComplete = "current-password",
  ...props
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      {...props}
      fullWidth={props.fullWidth ?? true}
      label={label}
      value={value}
      onChange={onChange}
      type={isVisible ? "text" : "password"}
      autoComplete={autoComplete}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={isVisible ? "Hide password" : "Show password"}
                edge="end"
                onClick={() => setIsVisible((currentValue) => !currentValue)}
              >
                {isVisible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export default PasswordField;
