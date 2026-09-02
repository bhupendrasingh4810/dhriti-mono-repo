"use client";

import { SearchRounded } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";

interface EmojiSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  disabled?: boolean;
}

export function EmojiSearch({ query, onQueryChange, disabled }: EmojiSearchProps) {
  return (
    <TextField
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder="Search emoji"
      aria-label="Search emoji"
      size="small"
      fullWidth
      disabled={disabled}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded sx={{ fontSize: 18, color: "text.secondary" }} />
            </InputAdornment>
          ),
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 1.5,
          fontSize: 13,
        },
      }}
    />
  );
}
