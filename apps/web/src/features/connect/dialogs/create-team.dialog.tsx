import React, { useState } from "react";
import { Dialog } from "@dhriti/ui/dialog";
import {
    Box,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from "@mui/material";

export function CreateTeamDialog({
    createTeamOpen,
    setCreateTeamOpen,
    pushSystemMessage,
    closeSidebarMenus,
}: {
    createTeamOpen: boolean;
    setCreateTeamOpen: (open: boolean) => void;
    pushSystemMessage: (message: string) => void;
    closeSidebarMenus: () => void;
}) {

    const [teamName, setTeamName] = useState("");
    const [teamDescription, setTeamDescription] = useState("");
    const [teamVisibility, setTeamVisibility] = useState("public");
    const [teamFirstChannelName, setTeamFirstChannelName] = useState("");

    return (
        <Dialog
            open={createTeamOpen}
            onClose={() => setCreateTeamOpen(false)}
            maxWidth="sm"
            fullWidth
            title="Create Team"
            primaryActionLabel="Create"
            onPrimaryAction={() => {
                pushSystemMessage(`Created ${teamVisibility} team ${teamName.trim()} with first channel ${teamFirstChannelName.trim()}.`);
                setCreateTeamOpen(false);
                setTeamName("");
                setTeamDescription("");
                setTeamVisibility("public");
                setTeamFirstChannelName("");
                closeSidebarMenus();
            }}
            isSubmitting={!teamName.trim() || !teamFirstChannelName.trim()}
        >
            <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField label="Team name" value={teamName} onChange={(event) => setTeamName(event.target.value)} required />
                <TextField label="Description" value={teamDescription} onChange={(event) => setTeamDescription(event.target.value)} multiline minRows={3} />
                <Box>
                    <InputLabel id="connect-team-type-label" sx={{ mb: 0.75, position: "static", transform: "none", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                        Team type
                    </InputLabel>
                    <Select labelId="connect-team-type-label" fullWidth value={teamVisibility} onChange={(event) => setTeamVisibility(event.target.value)}>
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                    </Select>
                </Box>
                <TextField label="First Channel name" value={teamFirstChannelName} onChange={(event) => setTeamFirstChannelName(event.target.value)} required />
            </Stack>
        </Dialog>
    );
}