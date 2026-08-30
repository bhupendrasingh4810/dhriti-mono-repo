import { Box, Stack, Typography, Button } from "@mui/material";
import { useState, useMemo } from "react";
import { PeopleRounded, VideocamRounded, CallRounded, MoreVertRounded, StarRounded, PersonRemoveRounded, Add } from "@mui/icons-material";
import { Popover, TextField, Avatar, IconButton } from "@dhriti/ui";
import { connectUsers } from "@/mocks/connect/users";
import { connectUsersById } from "@/mocks/connect";

interface ConversationHeaderProps {
    conversation: {
        id: string;
        name: string;
        type: "channel" | "direct" | "group";
        isFavorite?: boolean;
        participants: string[];
    };
    teamLabel: string;
    onOpenDetails: () => void;
}

export function ConversationHeader({
    conversation,
    teamLabel,
    onOpenDetails,
}: ConversationHeaderProps) {
    const currentUser = connectUsers[0]; // Assuming the first user is the current user for this example
    const [participantsAnchor, setParticipantsAnchor] = useState<HTMLElement | null>(null);
    const [participantSearch, setParticipantSearch] = useState("");

    const participants = useMemo(
        () => conversation.participants.map((id) => connectUsersById[id]).filter(Boolean),
        [conversation]
    );

    const addableUsers = useMemo(() => {
        const set = new Set(conversation.participants);
        return connectUsers
            .filter((user) => !set.has(user.id))
            .filter((user) => user.displayName.toLowerCase().includes(participantSearch.toLowerCase()))
            .slice(0, 8);
    }, [conversation, participantSearch]);

    function handleAddParticipant(userId: string) {
        const user = connectUsersById[userId];

        // setConversationsById((previous) => {
        //     const conversation = previous[conversation.id];
        //     if (!conversation || conversation.participants.includes(userId)) return previous;

        //     return {
        //         ...previous,
        //         [conversation.id]: {
        //             ...conversation,
        //             participants: [...conversation.participants, userId],
        //         },
        //     };
        // });

        // if (user) {
        //     pushSystemMessage(`${user.displayName} was added to this conversation.`);
        // }
    }

    function handleRemoveParticipant(userId: string) {
        const user = connectUsersById[userId];

        // setConversationsById((previous) => {
        //     const conversation = previous[conversation.id];
        //     if (!conversation || !conversation.participants.includes(userId) || userId === currentUser.id) return previous;

        //     return {
        //         ...previous,
        //         [conversation.id]: {
        //             ...conversation,
        //             participants: conversation.participants.filter((id) => id !== userId),
        //         },
        //     };
        // });

        // if (user) {
        //     pushSystemMessage(`${user.displayName} was removed from this conversation.`);
        // }
    }

    return (
        <>
            <Box sx={{ height: 56, px: 3, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: 22, color: "#9ca3af", fontWeight: 700 }}>{conversation.type === "channel" ? "#" : "@"}</Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, cursor: "pointer" }} onClick={onOpenDetails}>
                        {conversation.name}
                    </Typography>
                    {conversation.isFavorite ? <StarRounded sx={{ fontSize: 16, color: "#facc15" }} /> : null}
                    <Stack direction="row" spacing={1} sx={{ ml: 2, pl: 2, borderLeft: "1px solid #f3f4f6", color: "#9ca3af", alignItems: "center" }}>
                        <Typography sx={{ fontSize: 12 }}>{teamLabel}</Typography>
                        <Box sx={{ width: 4, height: 4, borderRadius: 99, bgcolor: "#e5e7eb" }} />
                        <Typography sx={{ fontSize: 12 }}>{conversation.participants.length} members</Typography>
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    {
                        conversation.type !== "direct" && (
                            <Button startIcon={<PeopleRounded sx={{ fontSize: 18 }} />} size="small" sx={{ color: "#4b5563", minWidth: "unset" }} onClick={(event) => setParticipantsAnchor(event.currentTarget)}>
                                {conversation.participants.length}
                            </Button>
                        )
                    }
                    {[VideocamRounded, CallRounded, MoreVertRounded].map((Icon, index) => (
                        <Box key={`${index}-head`} sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", color: "#9ca3af", "&:hover": { bgcolor: "#f9fafb" } }}>
                            <Icon sx={{ fontSize: 22 }} />
                        </Box>
                    ))}
                </Stack>
            </Box>

            <Popover open={Boolean(participantsAnchor)} anchorEl={participantsAnchor} onClose={() => { setParticipantsAnchor(null); setParticipantSearch(""); }} disableScrollLock anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
                <Box sx={{ width: 340, p: 1.5 }}>
                    <Typography sx={{ fontSize: 11, color: "#9ca3af", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>Participants</Typography>
                    <TextField fullWidth size="small" placeholder="Search user to add" value={participantSearch} onChange={(event) => setParticipantSearch(event.target.value)} />

                    <Typography sx={{ mt: 1.25, mb: 0.6, fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>In this conversation</Typography>
                    <Stack spacing={0.4} sx={{ maxHeight: 160, overflowY: "auto" }}>
                        {participants.map((user) => (
                            <Stack key={user.id} direction="row" spacing={1} sx={{ px: 0.5, py: 0.6, alignItems: "center", justifyContent: "space-between" }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <Avatar src={user.avatar} sx={{ width: 24, height: 24 }} />
                                    <Box>
                                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{user.displayName}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{user.jobTitle}</Typography>
                                    </Box>
                                </Stack>
                                {user.id !== currentUser.id ? (
                                    <IconButton size="small" onClick={() => handleRemoveParticipant(user.id)}><PersonRemoveRounded sx={{ fontSize: 16 }} /></IconButton>
                                ) : null}
                            </Stack>
                        ))}
                    </Stack>

                    <Typography sx={{ mt: 1.2, mb: 0.6, fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>Add more users</Typography>
                    <Stack spacing={0.4} sx={{ maxHeight: 160, overflowY: "auto" }}>
                        {addableUsers.map((user) => (
                            <Stack key={user.id} direction="row" spacing={1} onClick={() => handleAddParticipant(user.id)} sx={{ px: 0.5, py: 0.6, alignItems: "center", justifyContent: "space-between", cursor: "pointer", '&:hover': { bgcolor: "#f9fafb" } }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <Avatar src={user.avatar} sx={{ width: 24, height: 24 }} />
                                    <Box>
                                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{user.displayName}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{user.jobTitle}</Typography>
                                    </Box>
                                </Stack>
                                <IconButton size="small" onClick={() => handleAddParticipant(user.id)}><Add sx={{ fontSize: 16 }} /></IconButton>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            </Popover>
        </>
    );
}