import React, { useState } from "react";
import {
    Stack,
    TextField,
    Box,
    InputLabel,
    Select,
    MenuItem,
    RadioGroup,
    FormControlLabel,
    Radio,
    Typography,
} from "@mui/material";
import { Dialog } from "@dhriti/ui/dialog"; // Adjust this path to match your file structure

// 📝 Define structural types for managing form inputs cleanly
interface CreateChannelModalProps {
    open: boolean;
    onClose: () => void;
    pushSystemMessage: (msg: string) => void;
    closeSidebarMenus: () => void;
}

export function CreateChannelDialog({
    open,
    onClose,
    pushSystemMessage,
    closeSidebarMenus,
}: CreateChannelModalProps) {

    const [channelName, setChannelName] = useState("");
    const [channelDescription, setChannelDescription] = useState("");
    const [channelType, setChannelType] = useState("standard");
    const [channelLayout, setChannelLayout] = useState("threads");

    // 🏎️ Centralize clean form submission tracking lifecycle logic
    const handleCreateChannel = () => {
        if (!channelName.trim()) return;

        pushSystemMessage(`Created channel ${channelName.trim()} with ${channelLayout} layout.`);

        // Reset Form Fields State
        setChannelName("");
        setChannelDescription("");
        setChannelType("standard");
        setChannelLayout("threads");

        // Close Window Actions
        closeSidebarMenus();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Create Channel"
            primaryActionLabel="Create"
            onPrimaryAction={handleCreateChannel}
            // Pass standard validation rule to disable action button if empty
            isSubmitting={!channelName.trim()}
            maxWidth="sm"
        >
            <Stack spacing={2}>
                <TextField
                    label="Channel name"
                    value={channelName}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChannelName(event.target.value)}
                    required
                    fullWidth
                />

                <TextField
                    label="Description"
                    value={channelDescription}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChannelDescription(event.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                />

                <Box>
                    <InputLabel
                        id="connect-channel-type-label"
                        sx={{ mb: 0.75, position: "static", transform: "none", fontSize: 12, fontWeight: 700, color: "#6b7280" }}
                    >
                        Choose a channel type
                    </InputLabel>
                    <Select
                        labelId="connect-channel-type-label"
                        fullWidth
                        value={channelType}
                        onChange={(event: React.ChangeEvent<{ value: string }>) => setChannelType(event.target.value)}
                    >
                        <MenuItem value="standard">Standard</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                        <MenuItem value="announcement">Announcement</MenuItem>
                    </Select>
                </Box>

                <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.75 }}>Layouts</Typography>
                    <RadioGroup row value={channelLayout} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChannelLayout(event.target.value)}>
                        <FormControlLabel value="threads" control={<Radio />} label="Threads" />
                        <FormControlLabel value="posts" control={<Radio />} label="Posts" />
                    </RadioGroup>
                </Box>
            </Stack>
        </Dialog>
    );
}
