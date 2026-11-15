import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InterviewFeedbackPage } from "../../interview-feedback-page";

const mocks = vi.hoisted(() => ({ interview: vi.fn(), submitInterviewFeedback: vi.fn() }));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "user", organization: { id: "org" } }, loading: false }),
}));
vi.mock("@/services/hrms-recruitment.service", () => ({ recruitmentService: mocks }));

const candidate = {
  id: "candidate",
  name: "Alex",
  email: "alex@example.com",
  phone: null,
  revision: 1,
  opening: { title: "Engineer", description: "Build products" },
  stage: { name: "Interview" },
  comments: [],
  interviewFeedback: [],
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.interview.mockResolvedValue(candidate);
  mocks.submitInterviewFeedback.mockResolvedValue({});
});
afterEach(cleanup);

describe("private interview feedback", () => {
  it("requires a verdict and feedback before submitting", async () => {
    render(<InterviewFeedbackPage candidateId="candidate" />);
    fireEvent.click(await screen.findByRole("button", { name: "Submit feedback" }));
    expect(screen.getByText("Select a result.")).toBeInTheDocument();
    expect(screen.getByText("Feedback is required.")).toBeInTheDocument();
    expect(mocks.submitInterviewFeedback).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox", { name: /Interview result/ }), { target: { value: "PASSED" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Feedback/ }), { target: { value: "Strong skills" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit feedback" }));
    await waitFor(() =>
      expect(mocks.submitInterviewFeedback).toHaveBeenCalledWith("org", candidate, "PASSED", "Strong skills"),
    );
    expect(await screen.findByText("Feedback submitted.")).toBeInTheDocument();
  });
  it("does not display candidate information when access is denied", async () => {
    mocks.interview.mockRejectedValue(new Error("Interview assignment not found."));
    render(<InterviewFeedbackPage candidateId="candidate" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Interview assignment not found.");
    expect(screen.queryByText("Alex")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit feedback" })).not.toBeInTheDocument();
  });
});
