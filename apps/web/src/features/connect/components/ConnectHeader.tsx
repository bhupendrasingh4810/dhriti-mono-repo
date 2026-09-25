"use client";

import { useMemo, useState } from "react";
import { Avatar, Badge, Box, IconButton, Stack, TextField, Typography } from "@dhriti/ui";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";

export type ConnectHeaderSearchItem = {
  id: string;
  title: string;
  description?: string;
};

type ConnectHeaderProps = {
  users?: ConnectHeaderSearchItem[];
  messages?: ConnectHeaderSearchItem[];
  files?: ConnectHeaderSearchItem[];
};

export function ConnectHeader({ users = [], messages = [], files = [] }: ConnectHeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const normalizedQuery = searchValue.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users
        .filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 6),
    [users, normalizedQuery],
  );
  const filteredMessages = useMemo(
    () =>
      messages
        .filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 6),
    [messages, normalizedQuery],
  );
  const filteredFiles = useMemo(
    () =>
      files
        .filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 6),
    [files, normalizedQuery],
  );

  const shouldShowResults = searchOpen && normalizedQuery.length > 0;

  return (
    <Box
      sx={{
        height: 68,
        px: 2,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "borders.borderSubtle",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
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
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 2,
              bgcolor: "primary.main",
              display: "grid",
              placeItems: "center",
              color: "primary.contrastText",
              fontWeight: "fontWeightBold",
              fontStyle: "italic",
            }}
          >
            F
          </Box>
          <Typography variant="h6" sx={{ fontWeight: "fontWeightBold" }}>
            Flowrise
          </Typography>
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
                startAdornment: <SearchRounded sx={{ fontSize: 16, color: "text.disabled", mr: 1 }} />,
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "surfaces.surfaceHover",
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
                bgcolor: "background.paper",
                border: 1,
                borderColor: "borders.borderSubtle",
                borderRadius: (theme) => theme.tokens.radius.md,
                boxShadow: (theme) => theme.tokens.elevation.high,
                maxHeight: 420,
                overflowY: "auto",
                zIndex: "modal",
              }}
            >
              {[
                { title: "Users", data: filteredUsers },
                { title: "Messages", data: filteredMessages },
                { title: "Files", data: filteredFiles },
              ].map((section) => (
                <Box
                  key={section.title}
                  sx={{
                    p: 1.25,
                    borderBottom: 1,
                    borderColor: "borders.borderSubtle",
                    "&:last-of-type": { borderBottom: "none" },
                  }}
                >
                  <Typography variant="overline" color="text.disabled" sx={{ mb: 0.8 }}>
                    {section.title}
                  </Typography>
                  <Stack spacing={0.4}>
                    {section.data.length > 0 ? (
                      section.data.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            px: 1,
                            py: 0.8,
                            borderRadius: (theme) => theme.tokens.radius.sm,
                            cursor: "pointer",
                            "&:hover": { bgcolor: "surfaces.surfaceHover" },
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                          {item.description ? (
                            <Typography variant="caption" color="text.secondary">
                              {item.description}
                            </Typography>
                          ) : null}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ px: 1, py: 0.8 }}>
                        No results
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifySelf: "end", gridColumn: { xs: "2 / 3", md: "3 / 4" } }}
        >
          <Badge
            badgeContent={3}
            color="warning"
            sx={{ "& .MuiBadge-badge": { fontSize: 9, minWidth: 14, height: 14, fontWeight: 700 } }}
          >
            <IconButton>
              <NotificationsNoneRounded fontSize="small" />
            </IconButton>
          </Badge>
          <IconButton>
            <HelpOutlineRounded fontSize="small" />
          </IconButton>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", pl: 1.5, ml: 0.5 }}>
            {/* <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.1 }}>Rahul Sharma</Typography>
              <Typography variant="overline" color="text.disabled" sx={{ lineHeight: 1.1 }}>Acme Technologies</Typography>
            </Box> */}
            <Avatar
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg"
              sx={{ width: 32, height: 32 }}
            />
            <ExpandMoreRounded sx={{ fontSize: 18, color: "text.disabled" }} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
