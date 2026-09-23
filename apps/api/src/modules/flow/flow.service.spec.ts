import { FlowService } from "./flow.service";

function makePrisma() {
  const project = { findUnique: jest.fn(), count: jest.fn(), create: jest.fn() };
  return {
    project,
    $transaction: jest.fn(async (callback: (transaction: { project: typeof project }) => unknown) => callback({ project })),
  };
}

describe("FlowService", () => {
  it("rejects project creation inside the transaction when the tenant limit is reached", async () => {
    const prisma = makePrisma();
    prisma.project.findUnique.mockResolvedValue(null);
    prisma.project.count.mockResolvedValue(2);
    const entitlements = { getLimit: jest.fn().mockResolvedValue(2) };
    const service = new FlowService(prisma as never, { record: jest.fn() } as never, entitlements as never);

    await expect(service.createProject("org-1", "user-1", { key: "PAY", name: "Payments" })).rejects.toMatchObject({ code: "ENTITLEMENT_LIMIT_EXCEEDED" });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
    expect(prisma.project.create).not.toHaveBeenCalled();
  });
});