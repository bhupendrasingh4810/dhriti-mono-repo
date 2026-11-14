"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Maximize2, MessageSquare, Minimize2, Sparkles, X } from "lucide-react";
import { AIMessage } from "./AIMessage";
import { assistantTokens as tokens } from "../theme/assistant";
import { spacingScale } from "../theme/spacing";
import { zIndex } from "../theme/zIndex";

export interface DhritiAIAssistantProps {
  title?: string;
  welcomeMessage?: string;
  suggestions?: readonly string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  welcomeVisible: boolean;
  onWelcomeVisibleChange: (visible: boolean) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  draft: string;
  onDraftChange: (draft: string) => void;
  messages: readonly DhritiAIMessage[];
  onSend: (text: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  position: DhritiAssistantPosition;
  onPositionChange: (position: DhritiAssistantPosition) => void;
  subtitle?: string;
  notice?: string;
  suggestionLabel?: string;
  welcomeActionLabel?: string;
  placeholder?: string;
  sendLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  error?: string;
}

export interface DhritiAIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}
export interface DhritiAssistantPosition {
  right: number;
  bottom: number;
}
const iconButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

type Position = DhritiAssistantPosition;
type Drag = { pointerId: number; x: number; y: number; position: Position; moved: boolean };
const subscribeToMount = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Fully controlled view: the parent owns state, content, sending policy and persistence. */
export function DhritiAIAssistant({
  title = "Dhriti AI Assistant",
  welcomeMessage,
  suggestions = [],
  open,
  onOpenChange,
  welcomeVisible,
  onWelcomeVisibleChange,
  expanded,
  onExpandedChange,
  draft,
  onDraftChange,
  messages,
  onSend,
  onSuggestionSelect,
  position,
  onPositionChange,
  subtitle,
  notice,
  suggestionLabel = "What would you like to explore?",
  welcomeActionLabel = "Explore with Dhriti AI",
  placeholder = "Ask about Dhriti...",
  sendLabel = "Send message",
  disabled = false,
  loading = false,
  loadingLabel = "Waiting for a response...",
  error,
}: DhritiAIAssistantProps) {
  const mounted = useSyncExternalStore(subscribeToMount, clientSnapshot, serverSnapshot);
  const [dragging, setDragging] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const id = useId();

  const constrain = useCallback((next: Position): Position => {
    const bounds = root.current?.getBoundingClientRect();
    return {
      right: Math.max(
        tokens.viewportMargin,
        Math.min(next.right, window.innerWidth - (bounds?.width ?? 0) - tokens.viewportMargin),
      ),
      bottom: Math.max(
        tokens.viewportMargin,
        Math.min(next.bottom, window.innerHeight - (bounds?.height ?? 0) - tokens.viewportMargin),
      ),
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const update = () => {
      const next = constrain(position);
      if (next.right !== position.right || next.bottom !== position.bottom) onPositionChange(next);
    };
    update();
    window.addEventListener("resize", update);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    if (root.current) observer?.observe(root.current);
    return () => {
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [mounted, open, expanded, welcomeVisible, constrain, position, onPositionChange]);

  useEffect(() => {
    if (mounted && open) composer.current?.focus();
  }, [mounted, open]);

  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages, open, loading, error]);

  function close() {
    onOpenChange(false);
    launcher.current?.focus();
  }

  function beginDrag(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    suppressClick.current = false;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, position, moved: false };
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) < tokens.dragThreshold) return;
    current.moved = true;
    setDragging(true);
    onPositionChange(
      constrain({
        right: current.position.right - dx,
        bottom: current.position.bottom - dy,
      }),
    );
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    // Pointer-up is followed by a click; a drag must not toggle the chat.
    suppressClick.current = event.type === "pointerup" && drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    const delta = spacingScale.lg;
    const offsets: Record<string, Position> = {
      ArrowLeft: { right: delta, bottom: 0 },
      ArrowRight: { right: -delta, bottom: 0 },
      ArrowUp: { right: 0, bottom: delta },
      ArrowDown: { right: 0, bottom: -delta },
    };
    const offset = offsets[event.key];
    if (event.key === "Home") {
      event.preventDefault();
      onPositionChange({ right: tokens.viewportMargin, bottom: tokens.viewportMargin });
    } else if (offset) {
      event.preventDefault();
      onPositionChange(constrain({ right: position.right + offset.right, bottom: position.bottom + offset.bottom }));
    }
  }

  function send() {
    const text = draft.trim();
    if (!text || disabled || loading) return;
    onSend(text);
    composer.current?.focus();
  }

  if (!mounted) return null;

  return createPortal(
    <div
      ref={root}
      className="fixed flex flex-col items-end font-sans text-text-primary"
      style={{
        ...position,
        zIndex: zIndex.floatingAssistant,
        gap: tokens.panelGap,
        maxWidth: `calc(100vw - ${tokens.viewportMargin * 2}px)`,
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <span id={`${id}-move-help`} className="sr-only">
        Drag to move, or use the arrow keys. Press Home to reset the position.
      </span>
      {open ? (
        <section
          id={`${id}-panel`}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${id}-title`}
          className="flex min-h-0 max-w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          style={{
            width: expanded ? tokens.expandedWidth : tokens.panelWidth,
            height: tokens.panelHeight,
            maxHeight: `calc(100dvh - ${tokens.launcherSize + tokens.panelGap + tokens.viewportMargin * 2}px)`,
          }}
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface-raised p-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles size={tokens.iconSize} className="shrink-0 text-brand" aria-hidden="true" />
              <div className="min-w-0">
                <h2 id={`${id}-title`} className="break-words text-sm font-semibold">
                  {title}
                </h2>
                {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                aria-label={expanded ? "Restore assistant size" : "Expand assistant"}
                className={iconButtonClass}
                onClick={() => onExpandedChange(!expanded)}
              >
                {expanded ? (
                  <Minimize2 size={tokens.iconSize} aria-hidden="true" />
                ) : (
                  <Maximize2 size={tokens.iconSize} aria-hidden="true" />
                )}
              </button>
              <button type="button" aria-label="Close assistant" className={iconButtonClass} onClick={close}>
                <X size={tokens.iconSize} aria-hidden="true" />
              </button>
            </div>
          </header>
          <div ref={transcript} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex items-start gap-2">
              <Sparkles size={tokens.iconSize} className="mt-1 shrink-0 text-brand" aria-hidden="true" />
              <div className="min-w-0 space-y-3">
                {welcomeMessage && (
                  <div className="break-words rounded-lg bg-surface-raised p-3">
                    <AIMessage role="assistant" text={welcomeMessage} />
                  </div>
                )}
                {suggestions.length > 0 && <p className="text-sm text-text-secondary">{suggestionLabel}</p>}
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion}-${index}`}
                      type="button"
                      disabled={disabled || loading}
                      className="max-w-full cursor-pointer break-words rounded-lg border border-border-strong px-3 py-2 text-left text-xs font-semibold text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        onSuggestionSelect(suggestion);
                        composer.current?.focus();
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div role="log" aria-label="Assistant conversation" aria-live="polite" className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${message.role === "user" ? "ml-6" : "mr-6"} break-words rounded-lg border border-border bg-surface-raised p-3`}
                >
                  <AIMessage role={message.role} text={message.text} />
                </div>
              ))}
            </div>
            {loading && (
              <p role="status" className="text-sm text-text-secondary">
                {loadingLabel}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}
          </div>
          <footer className="shrink-0 border-t border-border p-3">
            {notice && <p className="mb-2 text-xs text-text-secondary">{notice}</p>}
            <form
              className="flex items-end gap-2 rounded-lg border border-border-strong bg-surface p-2 focus-within:border-brand"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <textarea
                ref={composer}
                aria-label="Message Dhriti AI Assistant"
                placeholder={placeholder}
                rows={2}
                value={draft}
                disabled={disabled || loading}
                onChange={(event) => onDraftChange(event.target.value)}
                className="min-w-0 flex-1 resize-none bg-surface text-sm text-text-primary outline-none placeholder:text-text-secondary"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
              <button
                type="submit"
                aria-label={sendLabel}
                disabled={disabled || loading || !draft.trim()}
                className={`${iconButtonClass} bg-brand text-text-inverse hover:bg-brand-dark`}
              >
                <ArrowUp size={tokens.iconSize} aria-hidden="true" />
              </button>
            </form>
          </footer>
        </section>
      ) : welcomeVisible ? (
        <aside
          aria-label="Assistant welcome"
          className="relative max-w-full rounded-xl border border-border bg-surface p-4 shadow-lg"
          style={{ width: tokens.welcomeWidth }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 break-words text-sm font-semibold text-brand">
              <Sparkles size={tokens.iconSize} aria-hidden="true" />
              {title}
            </span>
            <button
              type="button"
              aria-label="Dismiss assistant welcome"
              className={iconButtonClass}
              onClick={() => onWelcomeVisibleChange(false)}
            >
              <X size={tokens.iconSize} aria-hidden="true" />
            </button>
          </div>
          {welcomeMessage && <p className="break-words text-sm text-text-secondary">{welcomeMessage}</p>}
          <button
            type="button"
            className="mt-3 cursor-pointer text-sm font-semibold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            onClick={() => {
              onOpenChange(true);
            }}
          >
            {welcomeActionLabel}
          </button>
        </aside>
      ) : null}
      <button
        ref={launcher}
        type="button"
        aria-label={open ? "Minimize Dhriti AI Assistant" : "Open Dhriti AI Assistant"}
        aria-expanded={open}
        aria-describedby={`${id}-move-help`}
        title="Click to toggle. Hold and drag to move; arrow keys reposition and Home resets."
        aria-controls={open ? `${id}-panel` : undefined}
        className={`flex items-center justify-center rounded-full bg-brand text-text-inverse shadow-lg transition-colors hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${dragging ? "cursor-grabbing" : "cursor-pointer"}`}
        style={{ width: tokens.launcherSize, height: tokens.launcherSize, touchAction: "none" }}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
        onKeyDown={moveWithKeyboard}
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          if (open) close();
          else {
            onOpenChange(true);
          }
        }}
      >
        {open ? <X aria-hidden="true" /> : <MessageSquare aria-hidden="true" />}
      </button>
    </div>,
    document.body,
  );
}
