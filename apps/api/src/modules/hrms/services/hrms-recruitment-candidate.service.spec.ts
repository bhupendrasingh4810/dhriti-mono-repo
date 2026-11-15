import { HrmsRecruitmentCandidateService } from "./hrms-recruitment-candidate.service";

const stageId = "2c43e0a2-b063-4b2b-8652-385d36457b03";

function setup(role: "MANAGER" | "INTERVIEWER" | null = "MANAGER", admin = false) {
  const db = {
    hrmsRecruitmentStage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    hrmsRecruitmentCandidate: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
    hrmsRecruitmentGrant: { findFirst: jest.fn() },
    hrmsRecruitmentComment: { create: jest.fn() },
    hrmsRecruitmentInterviewFeedback: { create: jest.fn() },
    organizationMember: { findFirst: jest.fn() },
    auditLog: { create: jest.fn() },
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation(async (arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: typeof db) => unknown)(db),
  );
  const recruitment = { access: jest.fn().mockResolvedValue({ role, admin }) };
  return { db, recruitment, service: new HrmsRecruitmentCandidateService(db as never, recruitment as never) };
}

describe("HrmsRecruitmentCandidateService", () => {
  it("denies interviewers access to the recruitment candidate list", async () => {
    const { db, service } = setup("INTERVIEWER");
    await expect(service.list("org", "interviewer", 1, "opening")).rejects.toThrow(
      "Recruitment manager access is required",
    );
    expect(db.hrmsRecruitmentCandidate.findMany).not.toHaveBeenCalled();
  });

  it("lists closed history within the manager's organization", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentCandidate.findMany.mockResolvedValue([]);
    db.hrmsRecruitmentCandidate.count.mockResolvedValue(0);
    await service.list("org", "interviewer", 1, undefined, "closed");
    expect(db.hrmsRecruitmentCandidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org", outcome: { not: null } },
      }),
    );
  });

  it("denies users without a grant and keeps inaccessible candidates hidden", async () => {
    const denied = setup(null);
    await expect(denied.service.list("org", "user", 1)).rejects.toThrow("Recruitment access is required");
    const { db, service } = setup("INTERVIEWER");
    await expect(service.details("org", "interviewer", "candidate")).rejects.toThrow(
      "Recruitment manager access is required",
    );
    expect(db.hrmsRecruitmentCandidate.findFirst).not.toHaveBeenCalled();
  });

  it("requires an administrator to add a stage", async () => {
    const { db, service } = setup("MANAGER");
    await expect(service.addStage("org", "manager", { name: "Review" })).rejects.toThrow(
      "Only organization administrators",
    );
    expect(db.hrmsRecruitmentStage.create).not.toHaveBeenCalled();
  });

  it("rejects stale moves and excludes Hired during the write", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentCandidate.findFirst.mockResolvedValue({
      stageId: "previous",
      stage: { systemKey: "APPLIED" },
      outcome: null,
    });
    db.hrmsRecruitmentStage.findFirst.mockResolvedValue({ id: stageId });
    db.hrmsRecruitmentCandidate.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.move("org", "manager", "candidate", { stageId, revision: 3 })).rejects.toThrow(
      "Candidate changed or access was revoked",
    );
    expect(db.hrmsRecruitmentCandidate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "candidate",
          organizationId: "org",
          revision: 3,
          outcome: null,
          stage: { OR: [{ systemKey: null }, { systemKey: { not: "HIRED" } }] },
        },
      }),
    );
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects outcomes unless the candidate is unchanged and in Hired", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentCandidate.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.close("org", "manager", "candidate", { outcome: "JOINED", revision: 2 })).rejects.toThrow(
      "Candidate must be in Hired and unchanged",
    );
    expect(db.hrmsRecruitmentCandidate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org", id: "candidate", revision: 2, outcome: null, stage: { systemKey: "HIRED" } },
      }),
    );
  });

  it("only exposes the private interview to its assigned user in the organization", async () => {
    const { db, service } = setup(null);
    db.hrmsRecruitmentCandidate.findFirst.mockResolvedValue(null);
    await expect(service.interviewDetails("org", "other", "candidate")).rejects.toThrow(
      "Interview assignment not found",
    );
    expect(db.hrmsRecruitmentCandidate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org", id: "candidate", interviewerUserId: "other", outcome: null },
      }),
    );
  });

  it("rechecks assignment and revision before storing interview feedback", async () => {
    const { db, service } = setup(null);
    db.hrmsRecruitmentCandidate.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.submitInterviewFeedback("org", "interviewer", "candidate", {
        verdict: "PASSED",
        feedback: "Good",
        revision: 4,
      }),
    ).rejects.toThrow("Interview assignment changed");
    expect(db.hrmsRecruitmentCandidate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org", id: "candidate", interviewerUserId: "interviewer", revision: 4, outcome: null },
      }),
    );
    expect(db.hrmsRecruitmentInterviewFeedback.create).not.toHaveBeenCalled();
  });

  it("stores and audits valid feedback without moving the candidate", async () => {
    const { db, service } = setup(null);
    db.hrmsRecruitmentCandidate.updateMany.mockResolvedValue({ count: 1 });
    db.hrmsRecruitmentInterviewFeedback.create.mockResolvedValue({ id: "feedback" });
    await expect(
      service.submitInterviewFeedback("org", "interviewer", "candidate", {
        verdict: "FAILED",
        feedback: "Feedback",
        revision: 4,
      }),
    ).resolves.toEqual({ revision: 5 });
    expect(db.hrmsRecruitmentInterviewFeedback.create).toHaveBeenCalledWith({
      data: {
        organizationId: "org",
        candidateId: "candidate",
        authorUserId: "interviewer",
        verdict: "FAILED",
        feedback: "Feedback",
      },
    });
    expect(db.auditLog.create).toHaveBeenCalled();
  });

  it("only assigns active employees with active memberships as interviewers", async () => {
    const { db, service } = setup();
    db.organizationMember.findFirst.mockResolvedValue(null);
    await expect(
      service.assignInterviewer("org", "manager", "candidate", {
        userId: "5f65bd02-7086-40a8-919a-7cc6e083400a",
        revision: 1,
      }),
    ).rejects.toThrow("Choose an active employee");
    expect(db.organizationMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org",
          user: expect.objectContaining({
            hrmsEmployees: { some: { organizationId: "org", status: "ACTIVE", deletedAt: null } },
          }),
        }),
      }),
    );
    expect(db.hrmsRecruitmentCandidate.updateMany).not.toHaveBeenCalled();
  });

  it("does not move a candidate out of Hired", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentCandidate.findFirst.mockResolvedValue({ outcome: null, stage: { systemKey: "HIRED" } });
    await expect(service.move("org", "manager", "candidate", { stageId, revision: 1 })).rejects.toThrow(
      "Hired is the final stage",
    );
    expect(db.hrmsRecruitmentCandidate.updateMany).not.toHaveBeenCalled();
  });
  it("requires a reason and a matching revision to reject a candidate", async () => {
    const { db, service } = setup();
    await expect(service.reject("org", "manager", "candidate", { reason: " ", revision: 1 })).rejects.toThrow();
    db.hrmsRecruitmentCandidate.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.reject("org", "manager", "candidate", { reason: "Not suitable", revision: 1 }),
    ).rejects.toThrow("Candidate changed");
    db.hrmsRecruitmentCandidate.updateMany.mockResolvedValue({ count: 1 });
    await service.reject("org", "manager", "candidate", { reason: "Not suitable", revision: 1 });
    expect(db.hrmsRecruitmentCandidate.updateMany).toHaveBeenLastCalledWith({
      where: { id: "candidate", organizationId: "org", revision: 1, outcome: null },
      data: { outcome: "REJECTED", rejectionReason: "Not suitable", revision: { increment: 1 } },
    });
    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
  });
  it("protects default and populated stages from deletion", async () => {
    const { db, service } = setup("MANAGER", true);
    db.hrmsRecruitmentStage.findFirst
      .mockResolvedValueOnce({ id: stageId, systemKey: "APPLIED" })
      .mockResolvedValueOnce({ id: stageId, systemKey: null });
    await expect(service.deleteStage("org", "admin", stageId)).rejects.toThrow("Default stages cannot be deleted");
    db.hrmsRecruitmentStage.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.deleteStage("org", "admin", stageId)).rejects.toThrow("historical candidates");
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
  it("rejects stale reordering and keeps Applied first and Hired last", async () => {
    const { db, service } = setup("MANAGER", true);
    const ids = [
      "10000000-0000-4000-8000-000000000001",
      "10000000-0000-4000-8000-000000000002",
      "10000000-0000-4000-8000-000000000003",
      "10000000-0000-4000-8000-000000000004",
      "10000000-0000-4000-8000-000000000005",
    ];
    db.hrmsRecruitmentStage.findMany.mockResolvedValue(
      ids.map((id, index) => ({ id, systemKey: index === 0 ? "APPLIED" : index === 4 ? "HIRED" : null })),
    );
    await expect(
      service.reorderStages("org", "admin", { stageIds: ids, expectedStageIds: [...ids].reverse() }),
    ).rejects.toThrow("Stages changed");
    await expect(
      service.reorderStages("org", "admin", { stageIds: [...ids].reverse(), expectedStageIds: ids }),
    ).rejects.toThrow("Applied must be first");
    const reordered = [ids[0], ids[2], ids[1], ids[3], ids[4]];
    await service.reorderStages("org", "admin", { stageIds: reordered, expectedStageIds: ids });
    expect(db.hrmsRecruitmentStage.update).toHaveBeenCalledTimes(5);
  });
  it("limits the unpaginated board to the tenant and includes history only when requested", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentCandidate.findMany.mockResolvedValue([]);
    await service.board("org", "manager", "opening");
    expect(db.hrmsRecruitmentCandidate.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { organizationId: "org", openingId: "opening", outcome: null },
      }),
    );
    await service.board("org", "manager", undefined, true);
    expect(db.hrmsRecruitmentCandidate.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { organizationId: "org" },
      }),
    );
    const denied = setup("INTERVIEWER");
    await expect(denied.service.board("org", "interviewer")).rejects.toThrow("manager access");
  });
});
