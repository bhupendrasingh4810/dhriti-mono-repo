"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

export type ConnectMentionsFilter = "unread" | "channels" | "chats";

export type ConnectMentionsViewItem = {
  id: string;
  messageId: string;
  conversationId: string;
  sourceType: "channel" | "person";
  sourceName: string;
  sourceAvatar?: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  excerpt: string;
  unread: boolean;
  createdAt: string;
};

export type ConnectMentionsViewMessage = {
  id: string;
  senderId: string;
  createdAt: string;
  content: string;
};

type ConnectMentionsViewProps = {
  items: ConnectMentionsViewItem[];
  usersById: Record<string, { id: string; displayName: string; avatar: string; jobTitle: string }>;
  selectedMentionId: string | null;
  filter: ConnectMentionsFilter;
  detail: {
    mentionId: string;
    conversationId: string;
    highlightedMessageId: string;
    sourceType: "channel" | "person";
    title: string;
    avatar?: string;
    subtitle?: string;
    lastMessage?: string;
    messages: ConnectMentionsViewMessage[];
  } | null;
  onSelectMention: (mentionId: string) => void;
  onFilterChange: (filter: ConnectMentionsFilter) => void;
  onOpenChannelMenu: (event: MouseEvent<HTMLElement>, mentionId: string) => void;
  onOpenCallOptions: (event: MouseEvent<HTMLElement>, mentionId: string) => void;
  onOpenInNewWindow: (mentionId: string) => void;
  onGoToChannel: (conversationId: string) => void;
  // renderMessageContent: (message: ConnectMentionsViewMessage) => ReactNode;
  composer: ReactNode;
};

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConnectMentionsView({
  items,
  usersById,
  selectedMentionId,
  filter,
  detail,
  onSelectMention,
  onFilterChange,
  onOpenChannelMenu,
  onOpenCallOptions,
  onOpenInNewWindow,
  onGoToChannel,
  // renderMessageContent,
  composer,
}: ConnectMentionsViewProps) {
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!detail?.highlightedMessageId) {
      setHighlightedMessageId(null);
      return;
    }

    setHighlightedMessageId(detail.highlightedMessageId);
    const timer = window.setTimeout(() => {
      setHighlightedMessageId((current) => (current === detail.highlightedMessageId ? null : current));
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [detail?.highlightedMessageId]);

  const filterCounts = useMemo(
    () => ({
      unread: items.filter((item) => item.unread).length,
      channels: items.filter((item) => item.sourceType === "channel").length,
      chats: items.filter((item) => item.sourceType === "person").length,
    }),
    [items],
  );

  const filters: Array<{ id: ConnectMentionsFilter; label: string; count: number }> = [
    { id: "unread", label: "Unread", count: filterCounts.unread },
    { id: "channels", label: "Channels", count: filterCounts.channels },
    { id: "chats", label: "Chats", count: filterCounts.chats },
  ];

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden bg-white">
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        {!detail ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="grid h-[72px] w-[72px] place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
              <MentionIcon className="h-[30px] w-[30px]" />
            </div>
            <p className="text-[15px] font-bold text-slate-900">
              When you select a mention, it&apos;ll show up here
            </p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {detail.avatar ? (
                  <img src={detail.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {detail.sourceType === "channel" ? "#" : detail.title.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{detail.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {detail.lastMessage ?? detail.subtitle ?? "Recent mention"}
                  </p>
                </div>
              </div>

              {detail.sourceType === "channel" ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => onGoToChannel(detail.conversationId)} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                    Go to channel
                  </button>
                  <button type="button" aria-label="More channel options" onClick={(event) => onOpenChannelMenu(event, detail.mentionId)} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-50">
                    <MoreIcon className="h-[18px] w-[18px]" />
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" aria-label="Start call" className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-50"><CallIcon className="h-[18px] w-[18px]" /></button>
                  <button type="button" title="More call options" aria-label="More call options" onClick={(event) => onOpenCallOptions(event, detail.mentionId)} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-50"><DownIcon className="h-[18px] w-[18px]" /></button>
                  <button type="button" aria-label="Open in new window" onClick={() => onOpenInNewWindow(detail.mentionId)} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-50"><LaunchIcon className="h-[18px] w-[18px]" /></button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                {detail.messages.map((message) => {
                  const sender = usersById[message.senderId];
                  const isHighlighted = highlightedMessageId === message.id;

                  return (
                    <div key={message.id} className="flex items-start gap-3">
                      {sender?.avatar ? <img src={sender.avatar} alt="" className="h-[34px] w-[34px] shrink-0 rounded-md object-cover" /> : <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">{(sender?.displayName ?? "Unknown User").charAt(0)}</span>}
                      <div className={`relative min-w-0 flex-1 ${isHighlighted ? "pr-[18px]" : ""}`}>
                        <div className="mb-1 flex items-baseline gap-2">
                          <span className="text-[13px] font-bold text-slate-900">{sender?.displayName ?? "Unknown User"}</span>
                          <span className="text-[10px] font-bold uppercase text-slate-400">{formatTime(message.createdAt)}</span>
                        </div>
                        <div className={`rounded-md bg-slate-50 p-3 transition-colors ${isHighlighted ? "border-2 border-red-500" : "border border-slate-200"}`}>
                          {/* {renderMessageContent(message)} */}
                        </div>
                        {isHighlighted ? (
                          <span className="absolute right-0 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-red-100 text-red-600"><MentionIcon className="h-4 w-4" /></span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100" />
            <div className="shrink-0">{composer}</div>
          </>
        )}
      </div>

      <aside className="flex w-[340px] shrink-0 flex-col border-l border-slate-100 bg-white">
        <div className="px-4 py-6"><h2 className="text-[15px] font-bold text-slate-900">Mentions</h2></div>
        <div className="border-t border-slate-100" />
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {filters.map((entry) => {
            const active = filter === entry.id;
            return (
              <button
                type="button"
                key={entry.id}
                onClick={() => onFilterChange(entry.id)}
                className={`rounded-full border px-3 py-1 text-[11.5px] font-bold ${active ? "border-red-200 bg-red-100 text-red-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}
              >
                {entry.label} {entry.count}
              </button>
            );
          })}
        </div>
        <div className="border-t border-slate-100" />
        <div className="flex-1 overflow-y-auto px-1.5 py-1">
          <div className="space-y-1">
            {items.slice(0, 30).map((item) => {
              const active = selectedMentionId === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onSelectMention(item.id)}
                  className={`flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors ${active ? "border-rose-200 bg-rose-50" : "border-transparent hover:bg-slate-50"}`}
                >
                  <img src={item.sourceType === "person" ? item.sourceAvatar : item.senderAvatar} alt="" className="h-[34px] w-[34px] shrink-0 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2"><span className="truncate text-[13px] font-bold text-slate-900">{item.sourceName}</span><span className="shrink-0 text-[10px] text-slate-400">{formatTime(item.createdAt)}</span></span>
                    <span className="block truncate text-[11px] font-semibold text-slate-500">{item.senderName}</span>
                    <span className="mt-0.5 block truncate text-xs leading-[1.45] text-slate-600">{item.excerpt}</span>
                  </span>
                  <span className="flex min-h-9 shrink-0 flex-col items-center justify-between">
                    {item.unread ? <span className="mt-0.5 h-2 w-2 rounded-full bg-red-500" /> : <span className="h-2 w-2" />}
                    <ChevronIcon className={`h-[15px] w-[15px] ${active ? "text-red-500" : "text-slate-300"}`} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

function MentionIcon({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><path d="M16 10v3a3 3 0 0 1-6 0v-3a3 3 0 0 1 6 0v5" /></svg>;
}

function MoreIcon({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
}

function CallIcon({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></svg>;
}

function DownIcon({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>;
}

function LaunchIcon({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>;
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>;
}
