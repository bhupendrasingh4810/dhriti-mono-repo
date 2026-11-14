import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { DhritiAIAssistant, type DhritiAIAssistantProps } from "../src/ai/DhritiAIAssistant";

function ControlledDemo(args: DhritiAIAssistantProps) {
  const [open, setOpen] = useState(args.open);
  const [welcomeVisible, setWelcomeVisible] = useState(args.welcomeVisible);
  const [expanded, setExpanded] = useState(args.expanded);
  const [draft, setDraft] = useState(args.draft);
  const [messages, setMessages] = useState(args.messages);
  const [position, setPosition] = useState(args.position);
  return (
    <DhritiAIAssistant
      {...args}
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
      onSuggestionSelect={setDraft}
    />
  );
}

const meta = {
  title: "AI/Dhriti AI Assistant",
  component: DhritiAIAssistant,
  render: (args) => <ControlledDemo {...args} />,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Dhriti AI Assistant",
    welcomeMessage: "Got questions? Explore Connect, Flow, Nexus, Pulse and Atlas with Dhriti.",
    open: false,
    onOpenChange: () => {},
    welcomeVisible: true,
    onWelcomeVisibleChange: () => {},
    expanded: false,
    onExpandedChange: () => {},
    draft: "",
    onDraftChange: () => {},
    messages: [],
    onSend: () => {},
    position: { right: 16, bottom: 16 },
    onPositionChange: () => {},
    suggestions: ["Explore Dhriti", "Help me get started", "Understand payroll"],
    onSuggestionSelect: () => {},
    subtitle: "UI preview · AI is not connected",
    notice: "UI preview only. Messages are not sent or saved.",
    sendLabel: "Add message to UI preview",
  },
} satisfies Meta<typeof DhritiAIAssistant>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LauncherOnly: Story = { args: { welcomeVisible: false } };
export const Open: Story = { args: { open: true } };
export const EmptySuggestions: Story = { args: { open: true, suggestions: [] } };
export const DisabledSend: Story = {
  args: { open: true },
  play: async () => {
    const page = within(document.body);
    await expect(await page.findByRole("button", { name: "Add message to UI preview" })).toBeDisabled();
  },
};
export const ConversationPreview: Story = {
  args: { open: true },
  play: async () => {
    const page = within(document.body);
    await userEvent.click(await page.findByRole("button", { name: "Understand payroll" }));
    await userEvent.click(page.getByRole("button", { name: "Add message to UI preview" }));
    await expect(page.getByRole("log")).toHaveTextContent("Understand payroll");
  },
};
export const Expanded: Story = {
  args: { open: true },
  play: async () => {
    const page = within(document.body);
    await userEvent.click(await page.findByRole("button", { name: "Expand assistant" }));
    await expect(page.getByRole("button", { name: "Restore assistant size" })).toBeVisible();
  },
};
export const FocusAndHover: Story = {
  args: { welcomeVisible: false },
  play: async () => {
    const page = within(document.body);
    const launcher = await page.findByRole("button", { name: "Open Dhriti AI Assistant" });
    await userEvent.hover(launcher);
    launcher.focus();
    await expect(launcher).toHaveFocus();
  },
};
export const LongContent: Story = {
  args: {
    open: true,
    title: "Dhriti AI Assistant for your organization's collaborative workspace",
    welcomeMessage:
      "Explore your workspace across Connect conversations, Flow workflows, Nexus knowledge, Pulse insights and Atlas planning. This is a UI-only preview and does not access your organization data.",
    suggestions: ["Help me understand a long workflow across multiple projects and teams", "A".repeat(120)],
  },
};
export const Mobile: Story = {
  args: { open: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const DarkTheme: Story = {
  args: { open: true },
  globals: { theme: "dark" },
};

export const Loading: Story = { args: { open: true, loading: true } };
export const Error: Story = { args: { open: true, error: "The parent app could not load the conversation." } };
export const Disabled: Story = { args: { open: true, disabled: true, draft: "Sending is unavailable." } };
export const ParentMessages: Story = {
  args: {
    open: true,
    messages: [
      { id: "user-1", role: "user", text: "Where do I set up payroll?" },
      {
        id: "assistant-1",
        role: "assistant",
        text: "This sample response is supplied by the parent, not generated by the UI component.",
      },
    ],
  },
};
