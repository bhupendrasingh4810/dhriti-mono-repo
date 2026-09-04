"use client";

import { useMemo, useState } from "react";
import {
  AddRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  FilterListRounded,
  MoreVertRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@dhriti/ui";
import { alpha } from "@mui/material/styles";

type EventTone = "info" | "success" | "warning" | "secondary" | "error";

type CalendarEvent = {
  id: string;
  day: number;
  startHour: number;
  durationHours: number;
  title: string;
  time: string;
  location: string;
  tone: EventTone;
};

const dayHeaders = ["Mon 25", "Tue 26", "Wed 27", "Thu 28", "Fri 29"];
const timeSlots = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM"];

const events: CalendarEvent[] = [
  { id: "e1", day: 0, startHour: 9.5, durationHours: 0.75, title: "Daily Standup", time: "9:30 - 10:00", location: "Room 2B", tone: "secondary" },
  { id: "e2", day: 1, startHour: 10, durationHours: 2, title: "Sprint Planning", time: "10:00 - 12:00", location: "Room 2B", tone: "success" },
  { id: "e3", day: 2, startHour: 11, durationHours: 1.25, title: "Product Discussion", time: "11:00 - 12:15", location: "Room 3A", tone: "info" },
  { id: "e4", day: 3, startHour: 10, durationHours: 1.5, title: "Architecture Review", time: "10:00 - 11:30", location: "Room 2B", tone: "secondary" },
  { id: "e5", day: 4, startHour: 9.5, durationHours: 1, title: "Product Roadmap", time: "9:30 - 10:30", location: "Room 3A", tone: "warning" },
  { id: "e6", day: 0, startHour: 14, durationHours: 1.5, title: "Architecture Review", time: "2:00 - 3:30", location: "Room 3A", tone: "warning" },
  { id: "e7", day: 1, startHour: 15, durationHours: 2, title: "Focus Time", time: "3:00 - 5:00", location: "Heads down", tone: "error" },
  { id: "e8", day: 4, startHour: 15, durationHours: 1, title: "Team Sync", time: "3:00 - 4:00", location: "Room 2B", tone: "secondary" },
];

function eventPalette(tone: EventTone) {
  if (tone === "success") {
    return { border: "success.main", bg: (theme: any) => alpha(theme.palette.success.main, 0.12), text: "success.dark" };
  }
  if (tone === "warning") {
    return { border: "warning.main", bg: (theme: any) => alpha(theme.palette.warning.main, 0.12), text: "warning.dark" };
  }
  if (tone === "secondary") {
    return { border: "secondary.main", bg: (theme: any) => alpha(theme.palette.secondary.main, 0.12), text: "secondary.main" };
  }
  if (tone === "error") {
    return { border: "error.main", bg: (theme: any) => alpha(theme.palette.error.main, 0.12), text: "error.dark" };
  }
  return { border: "info.main", bg: (theme: any) => alpha(theme.palette.info.main, 0.12), text: "info.dark" };
}

function MiniCalendar({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const monthStart = new Date(value.getFullYear(), value.getMonth(), 1);
  const firstDayOffset = monthStart.getDay();
  const daysInMonth = new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6" sx={{ fontWeight: "fontWeightBold" }}>
        {value.toLocaleString("default", { month: "long", year: "numeric" })}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
          <Typography key={`${label}-${index}`} variant="caption" color="text.disabled" sx={{ textAlign: "center", fontWeight: 700 }}>
            {label}
          </Typography>
        ))}
        {cells.map((day, index) => {
          const selected = day === value.getDate();
          return (
            <Button
              key={`${day ?? "empty"}-${index}`}
              size="small"
              disabled={!day}
              variant={selected ? "contained" : "text"}
              onClick={() => day && onChange(new Date(value.getFullYear(), value.getMonth(), day))}
              sx={{ minWidth: 0, width: 32, height: 32, p: 0, borderRadius: (theme) => theme.tokens.radius.pill }}
            >
              {day ?? ""}
            </Button>
          );
        })}
      </Box>
    </Stack>
  );
}

export default function PulsePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 7, 29));

  const nowLinePosition = useMemo(() => {
    const hours = selectedDate.getHours() + selectedDate.getMinutes() / 60;
    return Math.min(Math.max((hours - 8) * 80, 0), timeSlots.length * 80);
  }, [selectedDate]);

  return (
    <Box sx={{ bgcolor: "background.paper", color: "text.primary", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
        <Box sx={{ width: 300, borderRight: 1, borderColor: "divider", bgcolor: "background.paper", overflowY: "auto" }}>
          <Box sx={{ p: 2.5 }}>
            <MiniCalendar value={selectedDate} onChange={setSelectedDate} />
          </Box>
          <Divider />
          <Stack spacing={3} sx={{ p: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1.25 }}>My Calendars</Typography>
              <Stack spacing={1.25}>
                {[
                  { label: "Calendar", checked: true },
                  { label: "Birthdays", checked: true },
                  { label: "Holidays", checked: true },
                ].map((item) => (
                  <Stack key={item.label} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Checkbox checked={item.checked} size="small" />
                    <Typography sx={{ fontSize: 14, color: "text.secondary", fontWeight: 600 }}>{item.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1.25 }}>Team: Rahul Sharma</Typography>
              <Stack spacing={1}>
                {["Rahul Sharma (You)", "Amit Verma", "Priya Nair", "Neha Joshi", "Karan Mehta"].map((name, index) => (
                  <Stack key={name} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Checkbox checked={index === 0} size="small" />
                    <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>{name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</Avatar>
                    <Typography sx={{ fontSize: 14, color: "text.secondary", fontWeight: 600 }}>{name}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
          <Stack direction="row" sx={{ p: 2.5, borderBottom: 1, borderColor: "divider", alignItems: "center", justifyContent: "space-between", gap: 1.5, bgcolor: "background.paper" }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Button variant="outlined" size="small">Today</Button>
              <IconButton size="small"><ChevronLeftRounded /></IconButton>
              <IconButton size="small"><ChevronRightRounded /></IconButton>
              <Typography sx={{ fontSize: 18, fontWeight: 800 }}>25 - 29 August 2025</Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Button variant="outlined" sx={{ px: 0 }} startIcon={<FilterListRounded />} />
              <Button variant="contained" startIcon={<AddRounded />}>New Meeting</Button>
              <IconButton><MoreVertRounded /></IconButton>
            </Stack>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", position: "relative" }}>
            <Box
              sx={{
                minWidth: 980,
                display: "grid",
                gridTemplateColumns: "80px repeat(5, minmax(160px, 1fr))",
                gridTemplateRows: "56px 44px",
                gridAutoRows: "80px",
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ position: "sticky", top: 0, zIndex: 3, borderBottom: 1, borderRight: 1, borderColor: "divider", bgcolor: "background.paper", display: "grid", placeItems: "center" }}>
                <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Time</Typography>
              </Box>
              {dayHeaders.map((day, index) => (
                <Box key={day} sx={{ position: "sticky", top: 0, zIndex: 3, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", display: "grid", placeItems: "center", color: index === 4 ? "primary.main" : "text.secondary" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{day}</Typography>
                </Box>
              ))}

              <Box sx={{ borderBottom: 1, borderRight: 1, borderColor: "divider", display: "grid", placeItems: "center" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>All Day</Typography>
              </Box>
              {["Independence Day", "", "Priya Nair Birthday", "", ""].map((label, index) => (
                <Box key={`all-day-${index}`} sx={{ borderBottom: 1, borderRight: index < 4 ? 1 : 0, borderColor: "divider", p: 0.75 }}>
                  {label ? (
                    <Paper variant="outlined" sx={{ px: 1, py: 0.65, borderColor: "divider", bgcolor: "background.default" }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{label}</Typography>
                    </Paper>
                  ) : null}
                </Box>
              ))}

              {timeSlots.map((slot, rowIndex) => (
                <Box key={slot} sx={{ display: "contents" }}>
                  <Box sx={{ borderBottom: 1, borderRight: 1, borderColor: "divider", p: 1 }}>
                    <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 700 }}>{slot}</Typography>
                  </Box>
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <Box key={`${slot}-${colIndex}`} sx={{ borderBottom: 1, borderRight: colIndex < 4 ? 1 : 0, borderColor: "divider", position: "relative" }} />
                  ))}
                </Box>
              ))}

              {events.map((event) => {
                const palette = eventPalette(event.tone);
                const top = 56 + 44 + (event.startHour - 8) * 80;
                const left = 80 + event.day * ((100 - 0) / 5);

                return (
                  <Box
                    key={event.id}
                    sx={{
                      position: "absolute",
                      top,
                      left: `calc(80px + (${event.day} * (100% - 80px) / 5) + 8px)`,
                      width: "calc((100% - 80px) / 5 - 16px)",
                      height: Math.max(event.durationHours * 80 - 8, 48),
                      borderLeft: 4,
                      borderColor: palette.border,
                      bgcolor: palette.bg,
                      borderRadius: (theme) => theme.tokens.radius.md,
                      p: 1,
                      overflow: "hidden",
                      zIndex: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: palette.text, lineHeight: 1.25 }} noWrap>
                      {event.title}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 0.25 }}>
                      {event.time}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: "text.disabled", mt: 0.2 }} noWrap>
                      {event.location}
                    </Typography>
                  </Box>
                );
              })}

              <Box
                sx={{
                  position: "absolute",
                  left: "calc(80px + (3 * (100% - 80px) / 5))",
                  width: "calc((100% - 80px) / 5)",
                  top: 56 + 44 + nowLinePosition,
                  height: 2,
                  bgcolor: "error.main",
                  zIndex: 4,
                }}
              >
                <Box sx={{ position: "absolute", top: -4, left: -4, width: 8, height: 8, borderRadius: (theme) => theme.tokens.radius.pill, bgcolor: "error.main" }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}