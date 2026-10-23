"use client";

import { useEffect, useState } from "react";
import type { ConnectMessage } from "@/mocks/connect/types";
import { connectService } from "@/services/connect.service";

type DeletedMessage = {
  organizationId: string;
  conversationId: string;
  message: ConnectMessage;
};

export function useMessageDeletion({
  organizationId,
  conversationId,
  messages,
  loadMessages,
  onError,
}: {
  organizationId: string;
  conversationId: string;
  messages: ConnectMessage[];
  loadMessages: (conversationId: string) => Promise<void>;
  onError: (reason: unknown) => void;
}) {
  const [deletedMessage, setDeletedMessage] = useState<DeletedMessage | null>(null);
  const [undoInProgress, setUndoInProgress] = useState(false);

  useEffect(() => {
    if (!deletedMessage) return;
    const timer = window.setTimeout(() => setDeletedMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [deletedMessage]);

  async function deleteMessage(messageId: string) {
    const message = messages.find((item) => item.id === messageId);
    if (!message) return;
    try {
      await connectService.deleteMessage(organizationId, messageId);
      setDeletedMessage({ organizationId, conversationId, message });
      await loadMessages(conversationId);
    } catch (reason) {
      onError(reason);
    }
  }

  async function undoDeleteMessage() {
    if (!deletedMessage || undoInProgress) return;
    if (deletedMessage.organizationId !== organizationId) {
      setDeletedMessage(null);
      return;
    }
    setUndoInProgress(true);
    try {
      await connectService.restoreMessage(deletedMessage.organizationId, deletedMessage.message.id);
      setDeletedMessage((current) => (current?.message.id === deletedMessage.message.id ? null : current));
      await loadMessages(deletedMessage.conversationId);
    } catch (reason) {
      onError(reason);
    } finally {
      setUndoInProgress(false);
    }
  }

  return { deletedMessage, undoInProgress, deleteMessage, undoDeleteMessage };
}
