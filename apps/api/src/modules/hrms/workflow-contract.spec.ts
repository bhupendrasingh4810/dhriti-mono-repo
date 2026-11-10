import { validateWorkflowGraph } from "./workflow-contract";

describe("validateWorkflowGraph", () => {
  const stages = [
    { id: "review", key: "review", name: "Review", type: "APPROVAL", assigneeRule: { kind: "INITIATOR" } },
    { id: "done", key: "done", name: "Done", type: "AUTOMATION", isTerminal: true },
  ];

  it("accepts a declarative, reachable approval graph", () => {
    expect(validateWorkflowGraph(stages, [{ from: "review", to: "done", action: "APPROVE" }]).stages).toHaveLength(2);
  });

  it("rejects executable-style conditions and invalid graph roots", () => {
    expect(() =>
      validateWorkflowGraph(stages, [
        { from: "review", to: "done", action: "APPROVE", condition: { expression: "process.exit()" } },
      ]),
    ).toThrow("invalid declarative condition");
    expect(() =>
      validateWorkflowGraph(
        [...stages, { id: "orphan", key: "orphan", name: "Orphan", type: "TASK" }],
        [{ from: "review", to: "done", action: "APPROVE" }],
      ),
    ).toThrow("exactly one start stage");
  });

  it("rejects reachable paths that cannot finish at a terminal stage", () => {
    expect(() =>
      validateWorkflowGraph(
        [
          ...stages,
          { id: "loop-a", key: "loop-a", name: "Loop A", type: "TASK" },
          { id: "loop-b", key: "loop-b", name: "Loop B", type: "TASK" },
        ],
        [
          { from: "review", to: "done", action: "APPROVE" },
          { from: "review", to: "loop-a", action: "REJECT" },
          { from: "loop-a", to: "loop-b", action: "COMPLETE" },
          { from: "loop-b", to: "loop-a", action: "COMPLETE" },
        ],
      ),
    ).toThrow("path to a terminal stage");
  });
});
