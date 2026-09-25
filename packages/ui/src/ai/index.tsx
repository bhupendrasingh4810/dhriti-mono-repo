"use client";

import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

export function AIResponse({ text }: { text: string }) {
  return (
    <Card sx={{ borderColor: "primary.main" }}>
      <CardContent>
        <Typography variant="body2">{text}</Typography>
      </CardContent>
    </Card>
  );
}

export function AIMessage({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {role}
      </Typography>
      <Typography variant="body2">{text}</Typography>
    </Stack>
  );
}

export function AISource({ title, href }: { title: string; href?: string }) {
  return <Chip component={href ? "a" : "div"} clickable={Boolean(href)} label={title} size="small" />;
}

export function AIInsight({ title, value }: { title: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

export function AISuggestion({ text }: { text: string }) {
  return <Chip size="small" label={text} variant="outlined" color="primary" />;
}

export function AIAction({ label, onClick }: { label: string; onClick?: () => void }) {
  return <Chip size="small" label={label} onClick={onClick} clickable color="primary" />;
}

export function AIThinkingIndicator({ label = "AI is thinking" }: { label?: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
      <Typography variant="caption">{label}</Typography>
    </Stack>
  );
}
