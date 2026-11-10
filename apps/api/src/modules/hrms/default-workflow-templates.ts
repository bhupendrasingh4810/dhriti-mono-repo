export type DefaultHrmsWorkflowTemplate = {
  key: string;
  name: string;
  stages: Array<Record<string, unknown>>;
  transitions: Array<Record<string, unknown>>;
};

const templates = [
  { key: "leave-request", name: "Leave Request", stages: ["Manager Review", "Approved", "Rejected"] },
  { key: "onboarding", name: "Onboarding", stages: ["Documentation", "Provisioning", "Completed"] },
  { key: "asset-request", name: "Asset Request", stages: ["Manager Review", "IT Fulfilment", "Completed"] },
  { key: "salary-revision", name: "Salary Revision", stages: ["Manager Review", "HR Review", "Approved"] },
  { key: "offboarding", name: "Offboarding", stages: ["Knowledge Transfer", "Clearance", "Completed"] },
  { key: "payroll-run", name: "Payroll Run", stages: ["Validation", "Finance Approval", "Paid"] },
] as const;

export function defaultHrmsWorkflowTemplates(): DefaultHrmsWorkflowTemplate[] {
  return templates.map((template) => {
    const stages = template.stages.map((name, position) => ({
      id: `${template.key}-${position + 1}`,
      key: `${template.key}-${position + 1}`,
      name,
      type:
        position === template.stages.length - 1
          ? "AUTOMATION"
          : position === 0 || name.includes("Approval") || name.includes("Review")
            ? "APPROVAL"
            : "TASK",
      ...(position === template.stages.length - 1
        ? { isTerminal: true }
        : { assigneeRule: { kind: "INITIATOR" }, requiredApprovals: 1 }),
      slaHours: position === template.stages.length - 1 ? 24 : 72,
    }));

    return {
      key: template.key,
      name: template.name,
      stages: stages,
      transitions: stages
        .slice(0, -1)
        .flatMap((stage, position) => [
          { from: stage.id, to: stages[position + 1].id, action: stage.type === "TASK" ? "COMPLETE" : "APPROVE" },
          ...(stage.type === "APPROVAL"
            ? [{ from: stage.id, to: stages[stages.length - 1].id, action: "REJECT" }]
            : []),
        ]),
    };
  });
}
