"use client";

import { Avatar, Box, Stack, Typography } from "@mui/material";

export type ConnectReactionUser = {
  id: string;
  avatar: string;
  displayName: string;
  jobTitle: string;
};

type ConnectReactionUsersListProps = {
  emoji: string;
  users: ConnectReactionUser[];
};

export function ConnectReactionUsersList({ emoji, users }: ConnectReactionUsersListProps) {
  return (
    <Box sx={{ minWidth: 220, p: 1.25 }}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          mb: 0.8,
        }}
      >
        Reacted with {emoji}
      </Typography>
      <Stack spacing={0.45}>
        {users.map((user) => (
          <Stack key={user.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Avatar src={user.avatar} sx={{ width: 22, height: 22 }} />
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{user.displayName}</Typography>
              <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{user.jobTitle}</Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
