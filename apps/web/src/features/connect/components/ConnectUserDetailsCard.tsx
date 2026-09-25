"use client";

import { useMemo, useState } from "react";
import {
  AccessTimeRounded,
  AccountTreeRounded,
  CallRounded,
  ChatBubbleOutlineRounded,
  CheckCircleRounded,
  ExpandLessRounded,
  ExpandMoreRounded,
  LocationOnRounded,
  MailOutlineRounded,
  VideocamRounded,
} from "@mui/icons-material";
import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";

type ConnectUserDetailsCardProps = {
  avatar: string;
  displayName: string;
  jobTitle: string;
  email?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  viewerTimezone?: string;
  reportsTo?: {
    displayName: string;
    jobTitle: string;
  };
  reactionContext?: {
    emoji: string;
    users: Array<{
      id: string;
      avatar: string;
      displayName: string;
      jobTitle: string;
    }>;
  };
};

function getTimezoneOffsetInMinutes(timezone: string, date: Date) {
  const localizedDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return Math.round((localizedDate.getTime() - date.getTime()) / 60000);
}

function formatDuration(totalMinutes: number) {
  const absolute = Math.abs(totalMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function ConnectUserDetailsCard({
  avatar,
  displayName,
  jobTitle,
  email,
  phone,
  location,
  timezone,
  viewerTimezone,
  reportsTo,
  reactionContext,
}: ConnectUserDetailsCardProps) {
  const [showMore, setShowMore] = useState(false);

  const timezoneStatus = useMemo(() => {
    if (!timezone || !viewerTimezone) {
      return "your time zone is 00:00 ahead";
    }

    const now = new Date();
    const userOffset = getTimezoneOffsetInMinutes(timezone, now);
    const viewerOffset = getTimezoneOffsetInMinutes(viewerTimezone, now);
    const difference = viewerOffset - userOffset;

    if (difference === 0) {
      return "your time zone is 00:00 ahead";
    }

    return `your time zone is ${formatDuration(difference)} ${difference > 0 ? "ahead" : "behind"}`;
  }, [timezone, viewerTimezone]);

  return (
    <Box sx={{ width: 390, p: 4 }}>
      <Stack spacing={1.75}>
        <Stack direction="row" spacing={2.25} sx={{ alignItems: "center" }}>
          <Avatar src={avatar} sx={{ width: 45, height: 45 }} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{displayName}</Typography>
            <Typography sx={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{jobTitle}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.9} sx={{ paddingTop: 1.5, paddingBottom: 1.5 }}>
          {[ChatBubbleOutlineRounded, AccountTreeRounded, VideocamRounded, CallRounded].map((Icon, index) => (
            <IconButton key={`${index}-quick`} size="medium" sx={{ p: 0.8 }}>
              <Icon sx={{ fontSize: 24, color: "#4b5563" }} />
            </IconButton>
          ))}
        </Stack>

        <Box
          sx={{
            border: "1px solid #dcfce7",
            bgcolor: "#f0fdf4",
            borderRadius: (theme) => theme.tokens.radius.md,
            p: 1.25,
          }}
        >
          <Stack spacing={0.85}>
            <Stack direction="row" spacing={0.8} sx={{ alignItems: "center" }}>
              <CheckCircleRounded sx={{ fontSize: 20, color: "#16a34a" }} />
              <Typography sx={{ fontSize: 12, color: "#166534", fontWeight: 700, lineHeight: 1.5 }}>
                Available Freen untill 28-08 Work hours: 09:00 - 18:00
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.8} sx={{ alignItems: "center" }}>
              <AccessTimeRounded sx={{ fontSize: 20, color: "#4b5563" }} />
              <Typography sx={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>{timezoneStatus}</Typography>
            </Stack>
          </Stack>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: 10,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 800,
              mb: 0.75,
              mt: 1.5,
            }}
          >
            Contacts
          </Typography>
          <Stack spacing={0.65}>
            <Stack direction="row" spacing={0.9} sx={{ alignItems: "center", py: 1 }}>
              <MailOutlineRounded sx={{ fontSize: 14, color: "#6b7280" }} />
              <Typography sx={{ fontSize: 12, color: "#374151", lineHeight: 1.45 }}>
                {email ?? "Not available"}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.9} sx={{ alignItems: "center", py: 1 }}>
              <CallRounded sx={{ fontSize: 14, color: "#6b7280" }} />
              <Typography sx={{ fontSize: 12, color: "#374151", lineHeight: 1.45 }}>
                {phone ?? "Not available"}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.9} sx={{ alignItems: "center", py: 1 }}>
              <LocationOnRounded sx={{ fontSize: 14, color: "#6b7280" }} />
              <Typography sx={{ fontSize: 12, color: "#374151", lineHeight: 1.45 }}>
                {location ?? "Not available"}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={0.5}
          onClick={() => setShowMore((previous) => !previous)}
          sx={{ alignItems: "center", cursor: "pointer", width: "fit-content", color: "#2563eb", pt: 0.25 }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Show more</Typography>
          {showMore ? <ExpandLessRounded sx={{ fontSize: 14 }} /> : <ExpandMoreRounded sx={{ fontSize: 14 }} />}
        </Stack>

        {reactionContext && reactionContext.users.length > 0 ? (
          <Box sx={{ pt: 1.25, borderTop: "1px solid #f3f4f6" }}>
            <Typography
              sx={{
                fontSize: 10,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 800,
                mb: 0.75,
              }}
            >
              Reacted with {reactionContext.emoji}
            </Typography>
            <Stack spacing={0.6}>
              {reactionContext.users.slice(0, 6).map((user) => (
                <Stack key={user.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Avatar src={user.avatar} sx={{ width: 22, height: 22 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }} noWrap>
                      {user.displayName}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#6b7280" }} noWrap>
                      {user.jobTitle}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        ) : null}

        {showMore ? (
          <Box sx={{ pt: 1.25, borderTop: "1px solid #f3f4f6" }}>
            <Typography
              sx={{
                fontSize: 10,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 800,
                mb: 0.55,
              }}
            >
              Reports To
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 700, lineHeight: 1.45 }}>
              {reportsTo?.displayName ?? "Not assigned"}
            </Typography>
            {reportsTo?.jobTitle ? (
              <Typography sx={{ fontSize: 11, color: "#6b7280", lineHeight: 1.45 }}>{reportsTo.jobTitle}</Typography>
            ) : null}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
