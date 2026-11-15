import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HrmsRecruitment } from "../../recruitment";

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  openings: vi.fn(),
  create: vi.fn(),
  grants: vi.fn(),
  members: vi.fn(),
  stages: vi.fn(),
  candidates: vi.fn(),
  board: vi.fn(),
  reject: vi.fn(),
  renameStage: vi.fn(),
  deleteStage: vi.fn(),
  reorderStages: vi.fn(),
  candidate: vi.fn(),
  assignees: vi.fn(),
  createCandidate: vi.fn(),
  move: vi.fn(),
  interviewers: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: "org" } } }) }));
vi.mock("next/navigation", () => ({ useParams: () => ({ organizationSlug: "acme" }) }));
vi.mock("@/services/hrms-recruitment.service", () => ({ recruitmentService: mocks }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.access.mockResolvedValue({ admin: false, role: "MANAGER" });
  mocks.openings.mockResolvedValue({ items: [], total: 0, open: 0, applied: 0, interviews: 0, hired: 0 });
  mocks.grants.mockResolvedValue([]);
  mocks.members.mockResolvedValue([]);
  mocks.create.mockResolvedValue({});
  mocks.stages.mockResolvedValue([{ id: "applied", name: "Applied", systemKey: "APPLIED", position: 100 }]);
  mocks.candidates.mockResolvedValue({ items: [], total: 0 });
  mocks.board.mockResolvedValue([]);
  mocks.reject.mockResolvedValue({});
  mocks.assignees.mockResolvedValue([]);
  mocks.createCandidate.mockResolvedValue({});
  mocks.move.mockResolvedValue({});
  mocks.interviewers.mockResolvedValue([]);
});
afterEach(cleanup);

describe("recruitment page", () => {
  it("uses the requested tabs and does not present unavailable workflows as real", async () => {
    render(<HrmsRecruitment />);
    expect(await screen.findByText("No job openings yet.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recruitment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Job openings", current: "page" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Offers" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reports" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Candidate pipeline" }));
    expect(await screen.findByRole("region", { name: "Applied candidates" })).toBeInTheDocument();
    expect(mocks.board).toHaveBeenCalledWith("org", undefined, false);
    expect(screen.queryByRole("button", { name: "Joined and declined" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });
  it("blocks opening data for users without recruitment access", async () => {
    mocks.access.mockResolvedValue({ admin: false, role: null });
    render(<HrmsRecruitment />);
    expect(await screen.findByText(/Recruitment access is restricted/)).toBeInTheDocument();
    expect(mocks.openings).not.toHaveBeenCalled();
  });
  it("allows administrators to rename, reorder and delete custom stages while protecting defaults", async () => {
    const stages = [
      { id: "applied", name: "Applied", systemKey: "APPLIED", position: 0 },
      { id: "screening", name: "Screening", systemKey: "SCREENING", position: 1 },
      { id: "custom", name: "Review", systemKey: null, position: 2 },
      { id: "hired", name: "Hired", systemKey: "HIRED", position: 3 },
    ];
    mocks.access.mockResolvedValue({ admin: true, role: "MANAGER" });
    mocks.stages.mockResolvedValue(stages);
    mocks.renameStage.mockResolvedValue({});
    mocks.reorderStages.mockResolvedValue({});
    mocks.deleteStage.mockResolvedValue({});
    render(<HrmsRecruitment />);
    fireEvent.click(await screen.findByRole("button", { name: "Candidate pipeline" }));
    expect(await screen.findByRole("button", { name: "Edit Review" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Applied" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move Applied right" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Edit Review" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Stage name/ }), { target: { value: "Assessment" } });
    fireEvent.click(screen.getByRole("button", { name: "Save stage" }));
    await waitFor(() => expect(mocks.renameStage).toHaveBeenCalledWith("org", "custom", "Assessment"));
    fireEvent.click(await screen.findByRole("button", { name: "Move Review left" }));
    await waitFor(() =>
      expect(mocks.reorderStages).toHaveBeenCalledWith(
        "org",
        ["applied", "custom", "screening", "hired"],
        ["applied", "screening", "custom", "hired"],
      ),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Delete Review" }));
    expect(screen.getByText(/historical records/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete stage" }));
    await waitFor(() => expect(mocks.deleteStage).toHaveBeenCalledWith("org", "custom"));
  });
  it("prevents interviewers from loading unrestricted openings", async () => {
    mocks.access.mockResolvedValue({ admin: false, role: "INTERVIEWER" });
    render(<HrmsRecruitment />);
    expect(await screen.findByText(/Interviewers access their assigned candidate/)).toBeInTheDocument();
    expect(mocks.openings).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Interviews" }));
    expect(screen.getByText(/Interviewers access their assigned candidate/)).toBeInTheDocument();
    expect(mocks.candidates).not.toHaveBeenCalled();
  });
  it("validates and saves a draft opening", async () => {
    render(<HrmsRecruitment />);
    fireEvent.click(await screen.findByRole("button", { name: "Create job opening" }));
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    expect(mocks.create).not.toHaveBeenCalled();
    for (const [field, value] of [
      ["Job title", "Engineer"],
      ["Department", "Product"],
      ["Location", "Remote"],
      ["Job description", "Build products"],
      ["Company name", "Example Co"],
      ["Minimum experience", "2"],
      ["Maximum experience", "5"],
      ["Number of openings", "3"],
      ["Minimum CTC", "120.50"],
      ["Maximum CTC", "240.75"],
      ["CTC currency code", "inr"],
      ["Key skills", "TypeScript, React"],
      ["Job highlights", "Flexible schedule"],
    ]) {
      fireEvent.change(screen.getByRole("textbox", { name: new RegExp(field) }), { target: { value } });
    }
    fireEvent.change(screen.getByLabelText("Posted date"), { target: { value: "2026-11-15" } });
    expect(screen.getByRole("checkbox", { name: "CTC not disclosed" })).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Applicants" })).toHaveValue("0");
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        "org",
        expect.objectContaining({
          title: "Engineer",
          description: "Build products",
          companyName: "Example Co",
          experienceMin: 2,
          experienceMax: 5,
          openingsCount: 3,
          ctcMin: "120.50",
          ctcMax: "240.75",
          ctcCurrency: "INR",
          ctcPeriod: "YEAR",
          ctcNotDisclosed: true,
          postedDate: "2026-11-15",
          highlights: "Flexible schedule",
          keySkills: ["TypeScript", "React"],
        }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("adds a candidate to an open opening", async () => {
    mocks.openings.mockResolvedValue({
      items: [{ id: "opening", title: "Engineer", status: "OPEN", _count: { candidates: 0 } }],
      total: 1,
      open: 1,
      applied: 0,
      interviews: 0,
      hired: 0,
    });
    render(<HrmsRecruitment />);
    fireEvent.click(await screen.findByRole("button", { name: "Candidate pipeline" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add candidate" }));
    await screen.findByRole("option", { name: "Engineer" });
    fireEvent.change(screen.getByRole("combobox", { name: /Open job opening/ }), { target: { value: "opening" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Candidate name/ }), { target: { value: "Alex" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Email/ }), { target: { value: "alex@example.com" } });
    const dialog = screen.getByRole("dialog", { name: "Add candidate" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add candidate" }));
    await waitFor(() =>
      expect(mocks.createCandidate).toHaveBeenCalledWith(
        "org",
        expect.objectContaining({ openingId: "opening", name: "Alex", email: "alex@example.com" }),
      ),
    );
  });
  it("moves an assigned candidate using the accessible stage selector", async () => {
    const applied = { id: "applied", name: "Applied", systemKey: "APPLIED", position: 100 };
    const screening = { id: "screening", name: "Screening", systemKey: "SCREENING", position: 200 };
    const candidate = {
      id: "candidate",
      name: "Alex",
      email: "alex@example.com",
      stageId: "applied",
      stage: applied,
      opening: { title: "Engineer" },
      assignedUserId: "interviewer",
      revision: 1,
      comments: [],
      interviewFeedback: [{ id: "feedback", verdict: "PASSED", feedback: "Strong skills" }],
      interviewerUserId: null,
    };
    mocks.stages.mockResolvedValue([applied, screening]);
    mocks.board.mockResolvedValue([candidate]);
    mocks.candidate.mockResolvedValue(candidate);
    render(<HrmsRecruitment />);
    fireEvent.click(await screen.findByRole("button", { name: "Candidate pipeline" }));
    expect(await screen.findByText("Interview: Passed")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /Alex/ }));
    expect(await screen.findByText(/Strong skills/)).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "Candidate details" });
    expect(dialog).toHaveClass("max-w-4xl");
    expect(within(dialog).getByRole("region", { name: "Candidate information" })).toBeInTheDocument();
    expect(within(dialog).getByRole("region", { name: "Candidate actions" })).toBeInTheDocument();
    fireEvent.change(await screen.findByRole("combobox", { name: "Pipeline stage" }), {
      target: { value: "screening" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Move candidate" }));
    await waitFor(() => expect(mocks.move).toHaveBeenCalledWith("org", candidate, "screening"));
  });
  it("requires a reason to reject a candidate from the board", async () => {
    const stage = { id: "applied", name: "Applied", systemKey: "APPLIED", position: 100 };
    const candidate = {
      id: "c1",
      name: "Alex",
      stageId: "applied",
      stage,
      opening: { title: "Engineer" },
      interviewFeedback: [],
      revision: 1,
    };
    mocks.board.mockResolvedValue([candidate]);
    render(<HrmsRecruitment />);
    fireEvent.click(await screen.findByRole("button", { name: "Candidate pipeline" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reject candidate" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Reject Alex" })).getByRole("button", { name: "Reject candidate" }),
    );
    expect(screen.getByText("A rejection reason is required.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /Rejection reason/ }), {
      target: { value: "Experience mismatch" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Reject Alex" })).getByRole("button", { name: "Reject candidate" }),
    );
    await waitFor(() => expect(mocks.reject).toHaveBeenCalledWith("org", candidate, "Experience mismatch"));
  });
  it("rejects invalid experience and CTC ranges before saving", async () => {
    render(<HrmsRecruitment />);
    fireEvent.click(await screen.findByRole("button", { name: "Create job opening" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Minimum experience/ }), { target: { value: "5" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Maximum experience/ }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "CTC not disclosed" }));
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    expect(screen.getByText("Maximum must be at least the minimum.")).toBeInTheDocument();
    expect(screen.getByText("Enter a minimum amount to disclose CTC.")).toBeInTheDocument();
    expect(screen.getByText("Enter a maximum amount to disclose CTC.")).toBeInTheDocument();
    expect(screen.getByText("Enter a three-letter currency code.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
