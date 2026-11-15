"use client";

import { useCallback, useState } from "react";
import { DhritiAIAssistant, assistantTokens, type DhritiAIMessage, type DhritiAssistantPosition } from "@dhriti/ui";

const welcomeDismissedKey = "dhriti-ai-welcome-dismissed";
let welcomeDismissedInMemory = false;

function isWelcomeVisible() {
  if (typeof window === "undefined") return false;
  try {
    return !welcomeDismissedInMemory && window.sessionStorage.getItem(welcomeDismissedKey) !== "1";
  } catch (error) {
    console.warn("Unable to read AI assistant welcome session state.", error);
    return !welcomeDismissedInMemory;
  }
}

/** The welcome dismissal lasts for this browser tab's session; preview messages remain local only. */
export function GlobalAIAssistant() {
  const [open, setOpen] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(isWelcomeVisible);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<DhritiAIMessage[]>([]);
  const [position, setPosition] = useState<DhritiAssistantPosition>({
    right: assistantTokens.viewportMargin,
    bottom: assistantTokens.viewportMargin,
  });
  const changeWelcomeVisible = useCallback((visible: boolean) => {
    setWelcomeVisible(visible);
    if (!visible) {
      try {
        window.sessionStorage.setItem(welcomeDismissedKey, "1");
      } catch (error) {
        welcomeDismissedInMemory = true;
        console.warn("Unable to save AI assistant welcome session state.", error);
      }
    }
  }, []);
  const changeOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) changeWelcomeVisible(false);
    },
    [changeWelcomeVisible],
  );

  return (
    <DhritiAIAssistant
      open={open}
      onOpenChange={changeOpen}
      welcomeVisible={welcomeVisible}
      onWelcomeVisibleChange={changeWelcomeVisible}
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
