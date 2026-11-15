import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import {
  DhritiAIAssistant as AssistantView,
  type DhritiAIAssistantProps,
  type DhritiAIMessage,
  type DhritiAssistantPosition,
} from "@dhriti/ui";
import { GlobalAIAssistant } from "../../global-ai-assistant";
import { assistantTokens } from "@dhriti/ui";

function DhritiAIAssistant({
  defaultOpen = false,
  showWelcome = true,
  ...props
}: {
  defaultOpen?: boolean;
  showWelcome?: boolean;
} & Pick<DhritiAIAssistantProps, "title" | "suggestions" | "welcomeMessage">) {
  const [open, setOpen] = useState(defaultOpen);
  const [welcomeVisible, setWelcomeVisible] = useState(showWelcome);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<DhritiAIMessage[]>([]);
  const [position, setPosition] = useState<DhritiAssistantPosition>({ right: 16, bottom: 16 });
  return (
    <AssistantView
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setWelcomeVisible(false);
      }}
      welcomeVisible={welcomeVisible}
      onWelcomeVisibleChange={setWelcomeVisible}
      expanded={expanded}
      onExpandedChange={setExpanded}
      draft={draft}
      onDraftChange={setDraft}
      messages={messages}
      onSend={(text) => {
        setMessages((current) => [...current, { id: String(current.length), role: "user", text }]);
        setDraft("");
      }}
      position={position}
      onPositionChange={setPosition}
      suggestions={["Explore Dhriti", "Help me get started", "Understand payroll"]}
      onSuggestionSelect={setDraft}
      welcomeMessage="Got questions?"
      notice="Messages are not sent or saved"
      sendLabel="Add message to UI preview"
      {...props}
    />
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal("PointerEvent", MouseEvent);
  Object.defineProperties(HTMLElement.prototype, {
    setPointerCapture: { configurable: true, value: vi.fn() },
    hasPointerCapture: { configurable: true, value: () => true },
    releasePointerCapture: { configurable: true, value: vi.fn() },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Dhriti AI Assistant", () => {
  it("emits callbacks without changing parent-controlled state or adding messages", () => {
    const props: DhritiAIAssistantProps = {
      open: true,
      onOpenChange: vi.fn(),
      welcomeVisible: true,
      onWelcomeVisibleChange: vi.fn(),
      expanded: false,
      onExpandedChange: vi.fn(),
      draft: "Parent draft",
      onDraftChange: vi.fn(),
      messages: [{ id: "reply", role: "assistant", text: "Parent supplied reply" }],
      onSend: vi.fn(),
      suggestions: ["Parent prompt"],
      onSuggestionSelect: vi.fn(),
      position: { right: 16, bottom: 16 },
      onPositionChange: vi.fn(),
    };
    const { rerender } = render(<AssistantView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(props.onSend).toHaveBeenCalledWith("Parent draft");
    expect(screen.getByRole("textbox")).toHaveValue("Parent draft");
    expect(within(screen.getByRole("log")).getAllByRole("article")).toHaveLength(1);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "New draft" } });
    expect(props.onDraftChange).toHaveBeenCalledWith("New draft");
    expect(screen.getByRole("textbox")).toHaveValue("Parent draft");
    fireEvent.click(screen.getByRole("button", { name: "Parent prompt" }));
    expect(props.onSuggestionSelect).toHaveBeenCalledWith("Parent prompt");
    fireEvent.click(screen.getByRole("button", { name: "Expand assistant" }));
    expect(props.onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Expand assistant" })).toBeInTheDocument();
    const launcher = screen.getByRole("button", { name: "Minimize Dhriti AI Assistant" });
    fireEvent.keyDown(launcher, { key: "ArrowLeft" });
    expect(props.onPositionChange).toHaveBeenCalledWith({ right: 32, bottom: 16 });
    expect(launcher.parentElement).toHaveStyle({ right: "16px" });
    fireEvent.click(screen.getByRole("button", { name: "Close assistant" }));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    rerender(<AssistantView {...props} open={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss assistant welcome" }));
    expect(props.onWelcomeVisibleChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    rerender(<AssistantView {...props} open={false} welcomeVisible={false} />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("renders parent-controlled loading, errors and disabled state", () => {
    const props: DhritiAIAssistantProps = {
      open: true,
      onOpenChange: vi.fn(),
      welcomeVisible: false,
      onWelcomeVisibleChange: vi.fn(),
      expanded: false,
      onExpandedChange: vi.fn(),
      draft: "Message",
      onDraftChange: vi.fn(),
      messages: [],
      onSend: vi.fn(),
      onSuggestionSelect: vi.fn(),
      position: { right: 16, bottom: 16 },
      onPositionChange: vi.fn(),
    };
    const { rerender } = render(
      <AssistantView {...props} loading loadingLabel="Parent is loading" error="Parent error" />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Parent is loading");
    expect(screen.getByRole("alert")).toHaveTextContent("Parent error");
    expect(screen.getByRole("textbox")).toBeDisabled();
    fireEvent.submit(screen.getByRole("textbox").closest("form")!);
    expect(props.onSend).not.toHaveBeenCalled();
    rerender(<AssistantView {...props} disabled />);
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps the web preview behavior in its parent controller", () => {
    render(<GlobalAIAssistant />);
    fireEvent.click(screen.getByRole("button", { name: "Open Dhriti AI Assistant" }));
    expect(screen.getByText(/UI preview only. Messages are not sent or saved/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Understand payroll" }));
    fireEvent.click(screen.getByRole("button", { name: "Add message to UI preview" }));
    expect(screen.getByRole("log")).toHaveTextContent("Understand payroll");
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("remembers welcome dismissal across remounts in the current tab session", () => {
    const first = render(<GlobalAIAssistant />);
    expect(screen.getByRole("complementary", { name: "Assistant welcome" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss assistant welcome" }));
    first.unmount();
    const second = render(<GlobalAIAssistant />);
    expect(screen.queryByRole("complementary", { name: "Assistant welcome" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Dhriti AI Assistant" })).toBeInTheDocument();
    second.unmount();
    window.sessionStorage.clear();
    render(<GlobalAIAssistant />);
    expect(screen.getByRole("complementary", { name: "Assistant welcome" })).toBeInTheDocument();
  });

  it("keeps the welcome dismissed after opening and closing the assistant", () => {
    const first = render(<GlobalAIAssistant />);
    fireEvent.click(screen.getByRole("button", { name: "Explore with Dhriti AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Close assistant" }));
    first.unmount();
    render(<GlobalAIAssistant />);
    expect(screen.queryByRole("complementary", { name: "Assistant welcome" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Dhriti AI Assistant" })).toBeInTheDocument();
  });

  it("does not render a portal during server rendering", () => {
    expect(renderToString(<DhritiAIAssistant />)).toBe("");
  });
  it("portals the welcome UI to the body and keeps the launcher after dismissing it", () => {
    const { container } = render(<DhritiAIAssistant />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.getByRole("complementary", { name: "Assistant welcome" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss assistant welcome" }));
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Dhriti AI Assistant" })).toHaveClass(
      "bg-brand",
      "text-text-inverse",
    );
  });

  it("opens, expands, minimizes and restores the chat with focus management", () => {
    render(<DhritiAIAssistant />);
    fireEvent.click(screen.getByRole("button", { name: "Open Dhriti AI Assistant" }));
    const dialog = screen.getByRole("dialog", { name: "Dhriti AI Assistant" });
    expect(dialog).toHaveAttribute("aria-modal", "false");
    expect(dialog).toHaveStyle({ width: `${assistantTokens.panelWidth}px` });
    expect(screen.getByRole("textbox")).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Expand assistant" }));
    expect(dialog).toHaveStyle({ width: `${assistantTokens.expandedWidth}px` });
    fireEvent.click(screen.getByRole("button", { name: "Restore assistant size" }));
    expect(dialog).toHaveStyle({ width: `${assistantTokens.panelWidth}px` });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Dhriti AI Assistant" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Open Dhriti AI Assistant" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close assistant" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an explicit UI-only disclosure and stages suggestions without inventing AI replies", () => {
    render(<DhritiAIAssistant defaultOpen />);
    expect(screen.getByText("Messages are not sent or saved")).toBeInTheDocument();
    const send = screen.getByRole("button", { name: "Add message to UI preview" });
    expect(send).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Understand payroll" }));
    expect(screen.getByRole("textbox")).toHaveValue("Understand payroll");
    expect(screen.getByRole("textbox")).toHaveFocus();
    fireEvent.click(send);
    expect(screen.getByRole("log")).toHaveTextContent("Understand payroll");
    expect(within(screen.getByRole("log")).getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(send).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Close assistant" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Dhriti AI Assistant" }));
    expect(screen.getByRole("log")).toHaveTextContent("Understand payroll");
  });

  it("supports Enter to preview a message and preserves Shift+Enter and composition", () => {
    render(<DhritiAIAssistant defaultOpen />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("log")).toBeEmptyDOMElement();
    fireEvent.change(input, { target: { value: "A draft" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(screen.getByRole("log")).toBeEmptyDOMElement();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("log")).toHaveTextContent("A draft");
  });

  it("moves with keyboard controls, clamps to the viewport and resets with Home", () => {
    render(<DhritiAIAssistant showWelcome={false} />);
    const handle = screen.getByRole("button", { name: "Open Dhriti AI Assistant" });
    const widget = handle.parentElement!;
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(widget).toHaveStyle({ right: "32px", bottom: "32px" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(widget).toHaveStyle({ right: "16px" });
    fireEvent.keyDown(handle, { key: "Home" });
    expect(widget).toHaveStyle({ right: "16px", bottom: "16px" });
  });

  it("drags from the launcher without opening the chat and suppresses the click after a drag", () => {
    render(<DhritiAIAssistant showWelcome={false} />);
    const handle = screen.getByRole("button", { name: "Open Dhriti AI Assistant" });
    const widget = handle.parentElement!;
    fireEvent.pointerDown(handle, { button: 0, clientX: 500, clientY: 500 });
    fireEvent.pointerMove(handle, { clientX: 400, clientY: 350 });
    expect(widget).toHaveStyle({ right: "116px", bottom: "166px" });
    fireEvent.pointerUp(handle);
    fireEvent.click(handle);
    fireEvent.pointerMove(handle, { clientX: 200, clientY: 100 });
    expect(widget).toHaveStyle({ right: "116px", bottom: "166px" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(handle);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps position when opening and stops moving after pointer cancellation", () => {
    render(<DhritiAIAssistant showWelcome={false} />);
    const handle = screen.getByRole("button", { name: "Open Dhriti AI Assistant" });
    const widget = handle.parentElement!;
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    fireEvent.click(screen.getByRole("button", { name: "Open Dhriti AI Assistant" }));
    expect(widget).toHaveStyle({ right: "32px" });
    fireEvent.pointerDown(handle, { button: 0, clientX: 500, clientY: 500 });
    fireEvent.pointerCancel(handle);
    fireEvent.pointerMove(handle, { clientX: 100, clientY: 100 });
    expect(widget).toHaveStyle({ right: "32px", bottom: "16px" });
  });

  it("treats small pointer movement as a normal click and does not show a separate drag grip", () => {
    render(<DhritiAIAssistant showWelcome={false} />);
    const launcher = screen.getByRole("button", { name: "Open Dhriti AI Assistant" });
    expect(screen.queryByRole("button", { name: "Move Dhriti AI Assistant" })).not.toBeInTheDocument();
    fireEvent.pointerDown(launcher, { button: 0, clientX: 500, clientY: 500 });
    fireEvent.pointerMove(launcher, { clientX: 501, clientY: 501 });
    fireEvent.pointerUp(launcher);
    fireEvent.click(launcher);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(launcher.parentElement).toHaveStyle({ right: "16px", bottom: "16px" });
  });

  it("repositions on viewport resize so the entire widget remains reachable", () => {
    render(<DhritiAIAssistant defaultOpen />);
    const handle = screen.getByRole("button", { name: "Minimize Dhriti AI Assistant" });
    const widget = handle.parentElement!;
    vi.spyOn(widget, "getBoundingClientRect").mockReturnValue({
      width: 288,
      height: 600,
      top: 0,
      left: 0,
      right: 288,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    vi.stubGlobal("innerWidth", 320);
    vi.stubGlobal("innerHeight", 632);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(widget).toHaveStyle({ right: "16px", bottom: "16px" });
    expect(screen.getByRole("dialog")).toHaveClass("max-w-full");
  });

  it("handles empty suggestions and long content without requiring app context", () => {
    render(
      <DhritiAIAssistant
        defaultOpen
        title="Workspace assistant"
        suggestions={[]}
        welcomeMessage={"Long text ".repeat(80)}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Workspace assistant" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Understand payroll" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
