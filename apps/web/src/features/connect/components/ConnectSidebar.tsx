import { useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { Archive, ChevronDown, Ellipsis } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
    ConnectSidebarConversation,
    ConnectSidebarMenuContext,
    ConnectSidebarQuickView,
    ConnectSidebarSectionId,
    ConnectSidebarTeamGroup,
} from "@/types/connect.types";

interface ConnectSidebarProps {
    quickViews: ConnectSidebarQuickView[];
    favoriteConversations: ConnectSidebarConversation[];
    chatConversations: ConnectSidebarConversation[];
    teams: ConnectSidebarTeamGroup[];
    selectedConversationId: string;
    activeQuickViewId?: string | null;
    onToggleTeam: (teamId: string) => void;
    onSelectConversation: (conversationId: string) => void;
    onSelectUser?: (userId: string) => void;
    onSelectQuickView: (quickViewId: ConnectSidebarQuickView["id"]) => void;
    onOpenSidebarMenu: (event: MouseEvent<HTMLElement>, context: ConnectSidebarMenuContext) => void;
}

interface SidebarSectionProps {
    sectionId: ConnectSidebarSectionId;
    title: string;
    open: boolean;
    onToggle: () => void;
    onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
    hoveredSectionId: ConnectSidebarSectionId | null;
    onHoverSection: (sectionId: ConnectSidebarSectionId | null) => void;
    menuTooltip: string;
    children: ReactNode;
}

function SidebarSection({
    sectionId,
    title,
    open,
    onToggle,
    onOpenMenu,
    hoveredSectionId,
    onHoverSection,
    menuTooltip,
    children,
}: SidebarSectionProps) {
    const hovered = hoveredSectionId === sectionId;

    return (
        <section
            className="relative"
            onMouseEnter={() => onHoverSection(sectionId)}
            onMouseLeave={() => onHoverSection(null)}
        >
            <div className="relative mb-1 flex h-7 items-center">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between px-1.5 text-left"
                >
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{title}</span>
                    <ChevronDown className={`h-[18px] w-[18px] text-white/70 transition-transform duration-150 ${open ? "rotate-0" : "-rotate-90"}`} />
                </button>
                <button
                    type="button"
                    title={menuTooltip}
                    aria-label={menuTooltip}
                    onClick={onOpenMenu}
                    className={`absolute right-7 grid h-7 w-7 cursor-pointer place-items-center rounded text-white/70 transition-opacity duration-150 hover:bg-white/10 ${hovered ? "opacity-100" : "pointer-events-none opacity-0"}`}
                >
                    <Ellipsis aria-hidden="true" />
                </button>
            </div>
            {open ? children : null}
        </section>
    );
}

function SidebarTrailingSlot({
    hovered,
    count,
    tooltip,
    onOpenMenu,
}: {
    hovered: boolean;
    count?: number;
    tooltip: string;
    onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
}) {
    return (
        <div className="relative h-7 w-7 shrink-0">
            {(count ?? 0) > 0 ? (
                <span className={`absolute inset-0 grid place-items-center text-xs font-semibold text-white transition-opacity duration-150 ${hovered ? "opacity-0" : "opacity-100"}`}>
                    {count}
                </span>
            ) : null}
            <button
                type="button"
                title={tooltip}
                aria-label={tooltip}
                onClick={onOpenMenu}
                className={`absolute inset-0 grid h-7 w-7 cursor-pointer place-items-center rounded text-white/70 transition-opacity duration-150 hover:bg-white/10 ${hovered ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
                <Ellipsis aria-hidden="true" />
            </button>
        </div>
    );
}

function ConversationAvatar({ conversation }: { conversation: ConnectSidebarConversation }) {
    if (!conversation.avatar) {
        return <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20 text-[10px] font-bold text-white">{conversation.name.slice(0, 1)}</span>;
    }

    return <img src={conversation.avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />;
}

function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>, onSelect: () => void) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect();
    }
}

export default function ConnectSidebar({
    quickViews,
    favoriteConversations,
    chatConversations,
    teams,
    selectedConversationId,
    activeQuickViewId,
    onToggleTeam,
    onSelectConversation,
    onSelectUser,
    onSelectQuickView,
    onOpenSidebarMenu,
}: ConnectSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [quickViewsOpen, setQuickViewsOpen] = useState(true);
    const [favouritesOpen, setFavouritesOpen] = useState(true);
    const [chatsOpen, setChatsOpen] = useState(true);
    const [visibleChatCount, setVisibleChatCount] = useState(10);
    const [teamsOpen, setTeamsOpen] = useState(true);
    const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
    const [hoveredSectionId, setHoveredSectionId] = useState<ConnectSidebarSectionId | null>(null);

    const sectionProps = (sectionId: ConnectSidebarSectionId, title: string, menuTooltip: string) => ({
        sectionId,
        title,
        hoveredSectionId,
        onHoverSection: setHoveredSectionId,
        menuTooltip,
        onOpenMenu: (event: MouseEvent<HTMLElement>) => onOpenSidebarMenu(event, { kind: "section", id: sectionId, label: title, sectionId }),
    });
    const conversationHref = (conversationId: string) => {
        const nextSearchParams = new URLSearchParams(searchParams.toString());
        nextSearchParams.set("conversation", conversationId);
        return `${pathname}?${nextSearchParams.toString()}`;
    };

    return (
        <aside
            style={{ backgroundColor: "#036c5f" }}
            className="hidden h-full min-h-0 w-[312px] shrink-0 flex-col overflow-hidden rounded-[20px] lg:flex">
            <div className="flex items-center justify-between p-4">
                <span className="text-sm font-bold text-white">Connect</span>
                <Ellipsis aria-hidden="true" className="text-white/70" />
            </div>

            <div className="min-h-0 flex-1 overflow-y-scroll p-3">
                <div className="space-y-6">
                    <SidebarSection {...sectionProps("quick-views", "Quick Views", "More quick view options")} open={quickViewsOpen} onToggle={() => setQuickViewsOpen((value) => !value)}>
                        <div className="space-y-1">
                            {quickViews.map((view) => {
                                const Icon = view.icon;
                                const rowId = `quick-view-${view.id}`;
                                const active = activeQuickViewId === view.id;
                                const hovered = hoveredRowId === rowId;
                                const select = () => onSelectQuickView(view.id);

                                return (
                                    <div key={view.id} role="button" tabIndex={0} onClick={select} onKeyDown={(event) => handleRowKeyDown(event, select)} onMouseEnter={() => setHoveredRowId(rowId)} onMouseLeave={() => setHoveredRowId((value) => (value === rowId ? null : value))} className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-1 transition-colors hover:bg-white/10 ${active ? "bg-white/20" : ""}`}>
                                        <div className="flex min-w-0 items-center gap-3 text-white/90">
                                            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-white/70"}`} />
                                            <span className={`truncate text-sm ${active ? "font-bold" : "font-semibold"}`}>{view.label}</span>
                                        </div>
                                        <SidebarTrailingSlot hovered={hovered} count={view.value} tooltip={view.id === "drafts" ? "More draft options" : "More quick view options"} onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: "quick-view", id: view.id, label: view.label, sectionId: "quick-views" })} />
                                    </div>
                                );
                            })}
                        </div>
                    </SidebarSection>

                    <SidebarSection
                        {...sectionProps("favorites", "Favorites", "More section options")}
                        open={favouritesOpen}
                        onToggle={() => setFavouritesOpen((value) => !value)}
                    >
                        <ConversationList
                            conversations={favoriteConversations}
                            sectionId="favorites"
                            selectedConversationId={selectedConversationId}
                            hoveredRowId={hoveredRowId}
                            setHoveredRowId={setHoveredRowId}
                            onSelectConversation={onSelectConversation}
                            conversationHref={conversationHref}
                            onOpenSidebarMenu={onOpenSidebarMenu}
                        />
                    </SidebarSection>

                    <SidebarSection
                        {...sectionProps("chats", "Chats", "More section options")}
                        open={chatsOpen}
                        onToggle={() => setChatsOpen((value) => !value)}
                    >
                        <ConversationList
                            conversations={chatConversations.slice(0, visibleChatCount)}
                            sectionId="chats"
                            selectedConversationId={selectedConversationId}
                            hoveredRowId={hoveredRowId}
                            setHoveredRowId={setHoveredRowId}
                            onSelectConversation={onSelectConversation}
                            conversationHref={conversationHref}
                            onSelectUser={onSelectUser}
                            onOpenSidebarMenu={onOpenSidebarMenu}
                        />
                        {visibleChatCount < chatConversations.length ? (
                            <button
                                type="button"
                                onClick={() => setVisibleChatCount((count) => count + 10)}
                                className="mt-1 rounded-md px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                Show More
                            </button>
                        ) : null}
                    </SidebarSection>

                    <SidebarSection
                        {...sectionProps("teams", "Teams & Channels", "More section options")}
                        open={teamsOpen}
                        onToggle={() => setTeamsOpen((value) => !value)}
                    >
                        <div className="space-y-1">
                            {teams.map((team) => (
                                <TeamGroup
                                    key={team.id}
                                    team={team}
                                    selectedConversationId={selectedConversationId}
                                    hoveredRowId={hoveredRowId}
                                    setHoveredRowId={setHoveredRowId}
                                    onToggleTeam={onToggleTeam}
                                    onSelectConversation={onSelectConversation}
                                    conversationHref={conversationHref}
                                    onOpenSidebarMenu={onOpenSidebarMenu}
                                />
                            ))}
                        </div>
                    </SidebarSection>
                </div>
            </div>
        </aside>
    );
}

function ConversationList({ conversations, sectionId, selectedConversationId, hoveredRowId, setHoveredRowId, onSelectConversation, conversationHref, onSelectUser, onOpenSidebarMenu }: {
    conversations: ConnectSidebarConversation[];
    sectionId: "favorites" | "chats";
    selectedConversationId: string;
    hoveredRowId: string | null;
    setHoveredRowId: (value: string | null | ((previous: string | null) => string | null)) => void;
    onSelectConversation: (conversationId: string) => void;
    conversationHref: (conversationId: string) => string;
    onSelectUser?: (userId: string) => void;
    onOpenSidebarMenu: (event: MouseEvent<HTMLElement>, context: ConnectSidebarMenuContext) => void;
}) {
    return <div className="space-y-1">{conversations.map((conversation) => {
        const rowId = `${sectionId}-${conversation.id}`;
        const selected = selectedConversationId === conversation.id;
        const unread = conversation.unreadCount ?? 0;
        const hovered = hoveredRowId === rowId;
        const select = () => {
            if (conversation.userId) onSelectUser?.(conversation.userId);
            else onSelectConversation(conversation.id);
        };
        const context: ConnectSidebarMenuContext = { kind: conversation.isSelfSpace ? "personal" : conversation.type === "channel" ? "channel" : "user", id: conversation.id, label: conversation.name, sectionId };
        const conversationLabel = <div className="flex min-w-0 items-center gap-2.5">{conversation.type === "channel" ? <span className={`text-sm font-bold ${selected ? "text-white" : "text-white/70"}`}>#</span> : <ConversationAvatar conversation={conversation} />}<span className={`truncate text-sm text-white/90 ${sectionId === "chats" && unread > 0 || selected ? "font-bold" : "font-medium"}`}>{conversation.name}</span></div>;
        const trailingSlot = !conversation.userId ? <SidebarTrailingSlot hovered={hovered} count={unread} tooltip={conversation.isSelfSpace ? "More personal options" : conversation.type === "channel" ? "More channel options" : "More chat options"} onOpenMenu={(event) => onOpenSidebarMenu(event, context)} /> : null;
        const className = `flex cursor-pointer items-center justify-between rounded-md px-3 py-1 transition-colors hover:bg-white/10 ${selected ? "bg-white/20" : ""}`;
        return conversation.userId
            ? <div key={conversation.id} role="button" tabIndex={0} onClick={select} onKeyDown={(event) => handleRowKeyDown(event, select)} onMouseEnter={() => setHoveredRowId(rowId)} onMouseLeave={() => setHoveredRowId((value) => (typeof value === "function" ? value : value === rowId ? null : value))} className={className}>{conversationLabel}</div>
            : <div key={conversation.id} onMouseEnter={() => setHoveredRowId(rowId)} onMouseLeave={() => setHoveredRowId((value) => (typeof value === "function" ? value : value === rowId ? null : value))} className={className}><Link href={conversationHref(conversation.id)} onClick={select} className="flex min-w-0 flex-1 items-center">{conversationLabel}</Link>{trailingSlot}</div>;
    })}</div>;
}

function TeamGroup({ team, selectedConversationId, hoveredRowId, setHoveredRowId, onToggleTeam, onSelectConversation, conversationHref, onOpenSidebarMenu }: {
    team: ConnectSidebarTeamGroup;
    selectedConversationId: string;
    hoveredRowId: string | null;
    setHoveredRowId: (value: string | null | ((previous: string | null) => string | null)) => void;
    onToggleTeam: (teamId: string) => void;
    onSelectConversation: (conversationId: string) => void;
    conversationHref: (conversationId: string) => string;
    onOpenSidebarMenu: (event: MouseEvent<HTMLElement>, context: ConnectSidebarMenuContext) => void;
}) {
    const TeamIcon = team.icon ?? Archive;
    const teamRowId = `team-${team.id}`;
    const teamHovered = hoveredRowId === teamRowId;

    return (
        <div className="space-y-1">
            <div
                onMouseEnter={() => setHoveredRowId(teamRowId)}
                onMouseLeave={() => setHoveredRowId((value) => (value === teamRowId ? null : value))}
                className="flex w-full items-center justify-between rounded px-1.5 transition-colors hover:bg-white/10"
            >
                <button type="button" onClick={() => onToggleTeam(team.id)} aria-expanded={team.isExpanded} className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left">
                    <ChevronDown className={`h-[18px] w-[18px] shrink-0 text-white/80 transition-transform ${team.isExpanded ? "rotate-0" : "-rotate-90"}`} />
                    <TeamIcon className="h-[18px] w-[18px] shrink-0 text-white/70" />
                    <span className="truncate text-sm font-bold text-white">{team.label}</span>
                </button>
                <SidebarTrailingSlot
                    hovered={teamHovered}
                    tooltip="More team options"
                    onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: "team", id: team.id, label: team.label, sectionId: "teams" })}
                />
            </div>
            {team.isExpanded ? (
                <div className="space-y-1">
                    {team.channels.map((channel) => {
                        const selected = selectedConversationId === channel.id;
                        const rowId = `channel-${channel.id}`;
                        const hovered = hoveredRowId === rowId;
                        const select = () => onSelectConversation(channel.id);

                        return (
                            <div
                                key={channel.id}
                                onMouseEnter={() => setHoveredRowId(rowId)}
                                onMouseLeave={() => setHoveredRowId((value) => (value === rowId ? null : value))}
                                className={`flex w-full items-center justify-between rounded px-1.5 transition-colors hover:bg-white/10 ${selected ? "bg-white/20" : ""}`}
                            >
                                <Link href={conversationHref(channel.id)} onClick={select} className={`min-w-0 flex-1 cursor-pointer py-1 pl-8 text-sm ${selected ? "font-bold text-white" : "font-medium text-white/80"}`}>
                                    {channel.isPrivate ? "lock " : "# "}{channel.slug}
                                </Link>
                                <SidebarTrailingSlot
                                    hovered={hovered}
                                    tooltip="More channel options"
                                    onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: "channel", id: channel.id, label: channel.name, parentId: team.id, sectionId: "teams" })}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
