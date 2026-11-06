import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { CallSidePanel } from "../CallSidePanel";

test("sends a chat message from the call panel", () => {
  const send = vi.fn();
  render(<CallSidePanel panel="chat" close={vi.fn()} participants={[]} availableUsers={[]} inviteSearch="" setInviteSearch={vi.fn()} toggleParticipant={vi.fn()} chatMessages={[]} chatDraft="Hello" setChatDraft={vi.fn()} sendChat={send} notes="" setNotes={vi.fn()} devices={[]} microphoneId="" setMicrophoneId={vi.fn()} speakerId="" setSpeakerId={vi.fn()} cameraId="" setCameraId={vi.fn()} captions={false} setCaptions={vi.fn()} transcription={false} setTranscription={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(send).toHaveBeenCalledOnce();
  expect(screen.getByText("No messages yet.")).toBeInTheDocument();
});
