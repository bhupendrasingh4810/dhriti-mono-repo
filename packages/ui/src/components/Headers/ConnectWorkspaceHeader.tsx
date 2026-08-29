"use client";

import { useMemo, useState } from "react";
import { Avatar, Badge, Box, Stack, TextField, Typography } from "@mui/material";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";

export type ConnectHeaderSearchItem = {
  id: string;
  title: string;
  description?: string;
};

type ConnectWorkspaceHeaderProps = {
  users?: ConnectHeaderSearchItem[];
  messages?: ConnectHeaderSearchItem[];
  files?: ConnectHeaderSearchItem[];
};

export function ConnectWorkspaceHeader({ users = [], messages = [], files = [] }: ConnectWorkspaceHeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const normalizedQuery = searchValue.trim().toLowerCase();
  const filteredUsers = useMemo(
    () => users.filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(normalizedQuery)).slice(0, 6),
    [users, normalizedQuery]
  );
  const filteredMessages = useMemo(
    () => messages.filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(normalizedQuery)).slice(0, 6),
    [messages, normalizedQuery]
  );
  const filteredFiles = useMemo(
    () => files.filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(normalizedQuery)).slice(0, 6),
    [files, normalizedQuery]
  );

  const shouldShowResults = searchOpen && normalizedQuery.length > 0;

  return (
    <Box sx={{ height: 68, px: 2, bgcolor: "#fff", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", flexShrink: 0 }}>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: { xs: "minmax(120px, auto) 1fr", md: "1fr minmax(420px, 640px) 1fr" },
          alignItems: "center",
          columnGap: 2,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: "fit-content" }}>
          <Box sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: "#fccf14", display: "grid", placeItems: "center", color: "#fff", fontWeight: 900, fontStyle: "italic", fontSize: 14 }}>F</Box>
          <Typography sx={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>Flowrise</Typography>
        </Stack>

        <Box sx={{ gridColumn: "2 / 3", width: "100%", maxWidth: 760, justifySelf: "center", position: "relative" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search (⌘ + K)"
            value={searchValue}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setSearchOpen(false), 120);
            }}
            onChange={(event) => setSearchValue(event.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchRounded sx={{ fontSize: 16, color: "#9ca3af", mr: 1 }} />,
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#f3f4f6",
                borderRadius: 2,
              },
            }}
          />

          {shouldShowResults && (
            <Box
              sx={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                bgcolor: "#fff",
                border: "1px solid #eef2f7",
                borderRadius: 2,
                boxShadow: "0 14px 32px rgba(15, 23, 42, 0.1)",
                maxHeight: 420,
                overflowY: "auto",
                zIndex: 40,
              }}
            >
              {[
                { title: "Users", data: filteredUsers },
                { title: "Messages", data: filteredMessages },
                { title: "Files", data: filteredFiles },
              ].map((section) => (
                <Box key={section.title} sx={{ p: 1.25, borderBottom: "1px solid #f8fafc", '&:last-of-type': { borderBottom: "none" } }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", mb: 0.8 }}>
                    {section.title}
                  </Typography>
                  <Stack spacing={0.4}>
                    {section.data.length > 0 ? (
                      section.data.map((item) => (
                        <Box key={item.id} sx={{ px: 1, py: 0.8, borderRadius: 1.5, cursor: "pointer", '&:hover': { bgcolor: "#f9fafb" } }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.title}</Typography>
                          {item.description ? <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{item.description}</Typography> : null}
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ px: 1, py: 0.8, fontSize: 12, color: "#9ca3af" }}>No results</Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifySelf: "end", gridColumn: { xs: "2 / 3", md: "3 / 4" } }}>
          <Badge badgeContent={3} color="warning" sx={{ "& .MuiBadge-badge": { fontSize: 9, minWidth: 14, height: 14, fontWeight: 700 } }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 99, display: "grid", placeItems: "center", color: "#6b7280", '&:hover': { bgcolor: "#f9fafb" } }}>
              <NotificationsNoneRounded fontSize="small" />
            </Box>
          </Badge>
          <Box sx={{ width: 36, height: 36, borderRadius: 99, display: "grid", placeItems: "center", color: "#6b7280", '&:hover': { bgcolor: "#f9fafb" } }}>
            <HelpOutlineRounded fontSize="small" />
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", pl: 1.5, ml: 0.5, borderLeft: "1px solid #f3f4f6" }}>
            <Box className="hidden sm:block" sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.1 }}>Rahul Sharma</Typography>
              <Typography sx={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.1 }}>Acme Technologies</Typography>
            </Box>
            <Avatar src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" sx={{ width: 32, height: 32 }} />
            <ExpandMoreRounded sx={{ fontSize: 14, color: "#9ca3af" }} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
