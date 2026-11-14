"use client";

import { useCallback, useState } from "react";
import { DhritiAIAssistant, assistantTokens, type DhritiAIMessage, type DhritiAssistantPosition } from "@dhriti/ui";

/** App-owned UI preview. No backend calls or persistence; sending only adds a local user message. */
export function GlobalAIAssistant() {
  const [open, setOpen] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<DhritiAIMessage[]>([]);
  const [position, setPosition] = useState<DhritiAssistantPosition>({
    right: assistantTokens.viewportMargin,
    bottom: assistantTokens.viewportMargin,
  });
  const changeOpen = useCallback((next: boolean) => {
    setOpen(next);
    if (next) setWelcomeVisible(false);
  }, []);

  return (
    <DhritiAIAssistant
      open={open}
      onOpenChange={changeOpen}
      welcomeVisible={welcomeVisible}
      onWelcomeVisibleChange={setWelcomeVisible}
      expanded={expanded}
      onExpandedChange={setExpanded}
      draft={draft}
      onDraftChange={setDraft}
      messages={messages}
      onSend={(text) => {
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]);
        setDraft("");
      }}
      suggestions={["Explore Dhriti", "Help me get started", "Understand payroll"]}
      onSuggestionSelect={setDraft}
      position={position}
      onPositionChange={setPosition}
      welcomeMessage="Got questions? Explore Dhriti with your AI assistant."
      subtitle="UI preview · AI is not connected"
      notice="UI preview only. Messages are not sent or saved. Please do not enter sensitive information."
      sendLabel="Add message to UI preview"
    />
  );
}
