"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import type { UIEvent } from "react";
import type { ConnectConversationMessage } from "@/types/connect.types";

export function useConversationHistory({
  conversationId,
  currentUserId,
  messages,
  loading,
  error,
  firstUnreadId,
  hasOlderMessages,
  hasNewerMessages,
  loadingMore,
  onLoadMore,
  onReadMessage,
}: {
  conversationId: string;
  currentUserId: string;
  messages: ConnectConversationMessage[];
  loading: boolean;
  error: string;
  firstUnreadId: string | null;
  hasOlderMessages: boolean;
  hasNewerMessages: boolean;
  loadingMore: boolean;
  onLoadMore?: (direction: "older" | "newer") => void;
  onReadMessage?: (messageId: string) => void;
}) {
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const initializedConversation = useRef<string | null>(null);
  const [positioned, setPositioned] = useState(false);
  const previousLastMessage = useRef<string | null>(null);
  const nearBottom = useRef(true);
  const scrollAnchor = useRef<{ id: string; offset: number } | null>(null);
  const notifyRead = useEffectEvent((messageId: string) => onReadMessage?.(messageId));

  useLayoutEffect(() => {
    const list = messageListRef.current;
    if (!list || loading || error) return;
    const lastMessage = messages[messages.length - 1];
    if (initializedConversation.current !== conversationId) {
      const unreadElement = firstUnreadId
        ? list.querySelector<HTMLElement>(`[data-message-id="${firstUnreadId}"]`)
        : null;
      list.scrollTop = unreadElement
        ? unreadElement.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop
        : list.scrollHeight;
      initializedConversation.current = conversationId;
      setPositioned(true);
    } else if (scrollAnchor.current) {
      const anchor = scrollAnchor.current;
      const element = list.querySelector<HTMLElement>(`[data-message-id="${anchor.id}"]`);
      if (element)
        list.scrollTop += element.getBoundingClientRect().top - list.getBoundingClientRect().top - anchor.offset;
      if (!loadingMore) scrollAnchor.current = null;
    } else if (
      lastMessage?.id !== previousLastMessage.current &&
      !hasNewerMessages &&
      (nearBottom.current || lastMessage?.senderId === currentUserId)
    ) {
      list.scrollTop = list.scrollHeight;
    }
    previousLastMessage.current = lastMessage?.id ?? null;
    nearBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 64;
  }, [conversationId, currentUserId, firstUnreadId, hasNewerMessages, error, loadingMore, loading, messages]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list || loading || !positioned || error) return;
    const visibleIncoming = new Map<string, ConnectConversationMessage>();
    const reportVisible = () => {
      if (document.visibilityState !== "visible") return;
      const latest = [...visibleIncoming.values()].sort(
        (first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt),
      )[0];
      if (latest) notifyRead(latest.id);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const messageId = (entry.target as HTMLElement).dataset.messageId;
          const message = messages.find((item) => item.id === messageId);
          if (!message || message.senderId === currentUserId) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) visibleIncoming.set(message.id, message);
          else visibleIncoming.delete(message.id);
        }
        reportVisible();
      },
      { root: list, threshold: [0, 0.5] },
    );
    list.querySelectorAll("[data-message-id]").forEach((element) => observer.observe(element));
    document.addEventListener("visibilitychange", reportVisible);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", reportVisible);
    };
  }, [currentUserId, error, loading, positioned, messages]);

  function loadMore(direction: "older" | "newer") {
    if (loadingMore || loading) return;
    const list = messageListRef.current;
    if (direction === "older" && list) {
      const first = list.querySelector<HTMLElement>("[data-message-id]");
      if (first)
        scrollAnchor.current = {
          id: first.dataset.messageId!,
          offset: first.getBoundingClientRect().top - list.getBoundingClientRect().top,
        };
    }
    onLoadMore?.(direction);
  }

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const list = event.currentTarget;
    nearBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 64;
    if (!positioned || loadingMore || loading) return;
    if (list.scrollTop < 48 && hasOlderMessages) loadMore("older");
    else if (nearBottom.current && hasNewerMessages) loadMore("newer");
  }

  return { messageListRef, positioned, loadMore, onScroll };
}
