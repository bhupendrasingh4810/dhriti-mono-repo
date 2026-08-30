
import React, { useState } from "react";
import { Stack, TextField } from "@mui/material";
import { Dialog } from "@dhriti/ui/dialog";

export function CreateSectionDialog({
    createSectionOpen,
    setCreateSectionOpen,
    pushSystemMessage,
    closeSidebarMenus,
}: {
    createSectionOpen: boolean;
    setCreateSectionOpen: (open: boolean) => void;
    pushSystemMessage: (message: string) => void;
    closeSidebarMenus: () => void;
}) {
    const [sectionEmoji, setSectionEmoji] = useState("");
    const [sectionName, setSectionName] = useState("");

    return (
        <Dialog
            open={createSectionOpen}
            onClose={() => setCreateSectionOpen(false)}
            maxWidth="xs"
            fullWidth
            title="Create a new section"
            primaryActionLabel="Create"
            onPrimaryAction={() => {
                pushSystemMessage(`Created section ${sectionEmoji ? `${sectionEmoji} ` : ""}${sectionName || "Untitled"}.`);
                setCreateSectionOpen(false);
                setSectionEmoji("");
                setSectionName("");
                closeSidebarMenus();
            }}
            isSubmitting={!sectionName.trim()}
        >
            <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField label="Emoji" placeholder="✨" value={sectionEmoji} onChange={(event) => setSectionEmoji(event.target.value)} />
                <TextField label="Section name" placeholder="Type a section name" value={sectionName} onChange={(event) => setSectionName(event.target.value)} />
            </Stack>
        </Dialog>
    );
}
