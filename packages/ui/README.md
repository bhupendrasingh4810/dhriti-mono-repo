# @dhriti/ui

Dhriti reusable UI package built on top of MUI and `@dhriti/theme`.

## Layers

- `mui`: direct MUI exports for primitives
- `components`: Dhriti foundation components (thin wrappers)
- `navigation`, `communication`, `work`, `knowledge`, `meetings`, `ai`, `organization`: reusable product-level visual components

## Usage

```tsx
import { DhritiButton, TaskCard, MessageBubble } from "@dhriti/ui";
```

Use MUI primitives directly where needed:

```tsx
import { Box, Stack, Typography } from "@mui/material";
```
