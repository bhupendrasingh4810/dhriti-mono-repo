"use client";

import dayjs from "dayjs";
import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

export function MeetingCard({ title, time }: { title: string; time?: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1">{title}</Typography>
        {time ? <Typography variant="body2" color="text.secondary">{time}</Typography> : null}
      </CardContent>
    </Card>
  );
}

export function ParticipantList({ participants }: { participants: string[] }) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      {participants.map((participant) => (
        <Chip key={participant} size="small" label={participant} />
      ))}
    </Stack>
  );
}

export function ActionItem({ text, done }: { text: string; done?: boolean }) {
  return <Chip size="small" color={done ? "success" : "default"} label={text} />;
}

export function DecisionCard({ title, decision }: { title: string; decision: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="body2">{decision}</Typography>
      </CardContent>
    </Card>
  );
}

export function VotingCard({ prompt, votes }: { prompt: string; votes: number }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2">{prompt}</Typography>
        <Typography variant="body2" color="text.secondary">Votes: {votes}</Typography>
      </CardContent>
    </Card>
  );
}

export function MiniCalendar({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        value={dayjs(value)}
        onChange={(next) => {
          if (!next) return;
          onChange(next.toDate());
        }}
        sx={(theme) => ({
          width: "100%",
          maxWidth: 320,
          mx: "auto",
          "& .MuiPickersCalendarHeader-root": {
            px: 1,
          },
          "& .MuiPickersCalendarHeader-label": {
            ...theme.typography.subtitle2,
            color: theme.palette.text.primary,
          },
          "& .MuiDayCalendar-weekDayLabel": {
            ...theme.typography.caption,
            color: theme.palette.text.secondary,
            fontWeight: 700,
          },
          "& .MuiPickersDay-root": {
            borderRadius: theme.tokens.radius.md,
            ...theme.typography.body2,
            color: theme.palette.text.primary,
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          },
          "& .MuiPickersDay-root.Mui-selected": {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          },
          "& .MuiPickersDay-today": {
            borderColor: alpha(theme.palette.primary.main, 0.5),
          },
        })}
      />
    </LocalizationProvider>
  );
}
