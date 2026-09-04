"use client";

import { ChevronRightRounded, CloseRounded, DescriptionOutlined, LinkRounded, NotificationsNoneRounded, PeopleRounded, PushPinRounded } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";

export type ConnectDetailFile = {
  id: string;
  originalName: string;
  size: number;
};

export type ConnectDetailMeeting = {
  id: string;
  title: string;
};

type ConnectChannelDetailsPanelProps = {
  open: boolean;
  title: string;
  type: "channel" | "direct" | "group";
  teamLabel: string;
  description: string;
  memberCount: number;
  pinnedCount: number;
  linkCount: number;
  files: ConnectDetailFile[];
  meetings: ConnectDetailMeeting[];
  onClose: () => void;
};

export function ConnectChannelDetailsPanel({
  open,
  title,
  type,
  teamLabel,
  description,
  memberCount,
  pinnedCount,
  linkCount,
  files,
  meetings,
  onClose,
}: ConnectChannelDetailsPanelProps) {
  return (
    <Box
      sx={{
        width: 312,
        bgcolor: "#fff",
        borderLeft: "1px solid #f3f4f6",
        display: { xs: "none", xl: open ? "flex" : "none" },
        flexDirection: "column",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {/* <Stack direction="row" sx={{ p: 2, borderBottom: "1px solid #f3f4f6", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Channel Details</Typography>
      </Stack> */}

      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 4 }}>
        
        <Box>
            <CloseRounded sx={{ fontSize: 18, color: "#9ca3af", cursor: "pointer", float: "right" }} onClick={onClose} />
        </Box>
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: (theme) => theme.tokens.radius.sm,
              bgcolor: type === "channel" ? "#eff6ff" : "#f9fafb",
              color: "#3b82f6",
              display: "grid",
              placeItems: "center",
              fontSize: 26,
              fontWeight: 700,
              border: "1px solid #dbeafe",
            }}
          >
            {type === "channel" ? "#" : "@"}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: 0.5 }}>{teamLabel}</Typography>
          </Box>
        </Stack>

        <Box>
          <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.09em", mb: 1.5 }}>About</Typography>
          <Typography sx={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>{description || "No additional description available."}</Typography>
        </Box>

        <Stack spacing={0.5}>
          {[
            { icon: PeopleRounded, label: "Members", value: memberCount },
            { icon: PushPinRounded, label: "Pinned", value: pinnedCount },
            { icon: DescriptionOutlined, label: "Files", value: files.length },
            { icon: LinkRounded, label: "Links", value: linkCount },
          ].map((row) => {
            const RowIcon = row.icon;
            return (
              <Stack key={row.label} direction="row" sx={{ p: 1, borderRadius: (theme) => theme.tokens.radius.sm, alignItems: "center", justifyContent: "space-between", "&:hover": { bgcolor: "#f9fafb" } }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                  <RowIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                  <Typography sx={{ fontSize: 14, color: "#374151" }}>{row.label}</Typography>
                </Stack>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{row.value}</Typography>
              </Stack>
            );
          })}
        </Stack>

        <Box>
          <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.09em", mb: 1.5 }}>Connected Work</Typography>
          <Stack spacing={1.25}>
            {files.slice(0, 2).map((file) => (
              <Stack key={file.id} direction="row" spacing={1.25} sx={{ p: 1.25, border: "1px solid #f3f4f6", borderRadius: (theme) => theme.tokens.radius.sm, alignItems: "center", "&:hover": { borderColor: "#e5e7eb" } }}>
                <Box sx={{ width: 32, height: 32, borderRadius: (theme) => theme.tokens.radius.sm, bgcolor: "#f0fdf4", color: "#16a34a", display: "grid", placeItems: "center" }}>
                  <DescriptionOutlined sx={{ fontSize: 14 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }} noWrap>{file.originalName}</Typography>
                  <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{(file.size / 1024).toFixed(0)} KB</Typography>
                </Box>
                <ChevronRightRounded sx={{ fontSize: 10, color: "#d1d5db" }} />
              </Stack>
            ))}

            {meetings.map((meeting) => (
              <Stack key={meeting.id} direction="row" spacing={1.25} sx={{ p: 1.25, border: "1px solid #f3f4f6", borderRadius: (theme) => theme.tokens.radius.sm, alignItems: "center", "&:hover": { borderColor: "#e5e7eb" } }}>
                <Box sx={{ width: 32, height: 32, borderRadius: (theme) => theme.tokens.radius.sm, bgcolor: "#fff7ed", color: "#ea580c", display: "grid", placeItems: "center" }}>
                  <NotificationsNoneRounded sx={{ fontSize: 14 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }} noWrap>{meeting.title}</Typography>
                  <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Scheduled</Typography>
                </Box>
                <ChevronRightRounded sx={{ fontSize: 10, color: "#d1d5db" }} />
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
