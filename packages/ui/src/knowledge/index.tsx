"use client";

import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

export function SpaceTree({ spaces }: { spaces: string[] }) {
  return (
    <Stack spacing={0.75}>
      {spaces.map((space) => (
        <Typography key={space} variant="body2">{space}</Typography>
      ))}
    </Stack>
  );
}

export function PageTree({ pages }: { pages: string[] }) {
  return (
    <Stack spacing={0.75}>
      {pages.map((page) => (
        <Typography key={page} variant="body2">{page}</Typography>
      ))}
    </Stack>
  );
}

export function KnowledgePageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h4">{title}</Typography>
      {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
    </Stack>
  );
}

export function DocumentCard({ title, summary }: { title: string; summary?: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1">{title}</Typography>
        {summary ? <Typography variant="body2" color="text.secondary">{summary}</Typography> : null}
      </CardContent>
    </Card>
  );
}

export function DocumentBreadcrumbs({ items }: { items: string[] }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      {items.map((item, index) => (
        <Chip key={`${item}-${index}`} size="small" label={item} />
      ))}
    </Stack>
  );
}
