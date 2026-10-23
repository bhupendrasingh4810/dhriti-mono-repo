"use client";

import { CheckCircle2, CheckCheck } from "lucide-react";
import type { ConnectConversationMessage, ConversationUser } from "@/types/connect.types";

export function MessageDeliveryStatus({ status }: { status: ConnectConversationMessage["status"] }) {
  if (status !== "sent" && status !== "delivered" && status !== "read") return null;
  const seen = status === "read";
  const label = seen ? "Seen" : "Sent";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`shrink-0 self-end ${seen ? "text-brand" : "text-text-secondary"}`}
    >
      {seen ? <CheckCheck size={16} /> : <CheckCircle2 size={16} />}
    </span>
  );
}

export function ConversationTypingIndicator({
  userIds,
  currentUserId,
  usersById,
}: {
  userIds: string[];
  currentUserId: string;
  usersById: Record<string, ConversationUser>;
}) {
  const names = userIds
    .filter((userId) => userId !== currentUserId && usersById[userId])
    .map((userId) => usersById[userId].displayName);
  return (
    <div role="status" aria-live="polite" className="flex h-8 shrink-0 items-center gap-2 px-4 text-brand">
      {names.length > 0 ? (
        <span className="flex min-w-0 items-center gap-2 text-xs">
          <span className="truncate">
            {names.join(", ")} {names.length === 1 ? "is" : "are"} typing
          </span>
          <span aria-hidden="true" className="flex shrink-0 items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-bounce" />
            <span
              className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-bounce"
              style={{ animationDelay: "-333ms" }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-bounce"
              style={{ animationDelay: "-666ms" }}
            />
          </span>
        </span>
      ) : null}
    </div>
  );
}
