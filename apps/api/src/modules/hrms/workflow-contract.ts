import { HttpStatus } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";

export const workflowStageTypes = ["APPROVAL", "TASK", "AUTOMATION", "CONDITION", "PARALLEL_GATE"] as const;
export const workflowActions = ["APPROVE", "REJECT", "COMPLETE"] as const;

export type WorkflowStage = {
  id: string;
  key: string;
  name: string;
  type: (typeof workflowStageTypes)[number];
  assigneeRule?: { kind: "INITIATOR" | "USER_IDS"; userIds?: string[] };
  requiredApprovals?: number;
  slaHours?: number;
  isTerminal?: boolean;
};

export type WorkflowTransition = {
  from: string;
  to: string;
  action: (typeof workflowActions)[number];
  condition?: { field: string; operator: "EQUALS" | "NOT_EQUALS" | "EXISTS"; value?: string | number | boolean };
};

const invalid = (message: string): never => {
  throw new AppError(ErrorCode.VALIDATION_FAILED, message, HttpStatus.BAD_REQUEST);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateWorkflowGraph(
  stages: unknown[],
  transitions: unknown[],
): {
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
} {
  if (!stages.length) {
    invalid("A workflow requires at least one stage");
  }
  if (stages.length > 100 || transitions.length > 500) {
    invalid("Workflow graph exceeds supported limits");
  }
  const parsedStages = stages.map((stage, index) => parseStage(stage, index));
  const identifiers = new Set<string>();
  const keys = new Set<string>();
  for (const stage of parsedStages) {
    if (identifiers.has(stage.id) || keys.has(stage.key)) {
      invalid("Stage ids and keys must be unique");
    }
    identifiers.add(stage.id);
    keys.add(stage.key);
  }
  const parsedTransitions = transitions.map((transition, index) => parseTransition(transition, index));
  const incoming = new Map(parsedStages.map((stage) => [stage.id, 0]));
  const outgoing = new Map(parsedStages.map((stage) => [stage.id, 0]));
  const edges = new Map(parsedStages.map((stage) => [stage.id, [] as string[]]));
  for (const transition of parsedTransitions) {
    if (!identifiers.has(transition.from) || !identifiers.has(transition.to)) {
      invalid("Transitions must reference known stage ids");
    }
    if (transition.from === transition.to) {
      invalid("Transitions cannot loop to the same stage");
    }
    incoming.set(transition.to, (incoming.get(transition.to) ?? 0) + 1);
    outgoing.set(transition.from, (outgoing.get(transition.from) ?? 0) + 1);
    edges.get(transition.from)?.push(transition.to);
  }
  const starts = parsedStages.filter((stage) => (incoming.get(stage.id) ?? 0) === 0);
  if (starts.length !== 1) {
    invalid("Workflow must have exactly one start stage");
  }
  const terminals = parsedStages.filter((stage) => stage.isTerminal);
  if (!terminals.length) {
    invalid("Workflow must have at least one terminal stage");
  }
  for (const stage of parsedStages) {
    const hasOutgoing = (outgoing.get(stage.id) ?? 0) > 0;
    if (stage.isTerminal && hasOutgoing) {
      invalid("Terminal stages cannot have outgoing transitions");
    }
    if (!stage.isTerminal && !hasOutgoing) {
      invalid("Non-terminal stages require an outgoing transition");
    }
  }
  const visited = new Set<string>();
  const visit = (stageId: string): void => {
    if (visited.has(stageId)) {
      return;
    }
    visited.add(stageId);
    for (const target of edges.get(stageId) ?? []) {
      visit(target);
    }
  };
  visit(starts[0].id);
  if (visited.size !== parsedStages.length) {
    invalid("Every stage must be reachable from the start stage");
  }
  const reverseEdges = new Map(parsedStages.map((stage) => [stage.id, [] as string[]]));
  for (const transition of parsedTransitions) {
    reverseEdges.get(transition.to)?.push(transition.from);
  }
  const canReachTerminal = new Set<string>();
  const visitReverse = (stageId: string): void => {
    if (canReachTerminal.has(stageId)) {
      return;
    }
    canReachTerminal.add(stageId);
    for (const source of reverseEdges.get(stageId) ?? []) {
      visitReverse(source);
    }
  };
  for (const terminal of terminals) {
    visitReverse(terminal.id);
  }
  if (canReachTerminal.size !== parsedStages.length) {
    invalid("Every stage must have a path to a terminal stage");
  }
  return { stages: parsedStages, transitions: parsedTransitions };
}

function parseStage(value: unknown, index: number): WorkflowStage {
  if (!isRecord(value)) {
    invalid(`Stage ${index + 1} must be an object`);
  }
  const stage = value as Record<string, unknown>;
  const { id, key, name, type, assigneeRule, requiredApprovals, slaHours, isTerminal } = stage;
  if (![id, key, name].every((field) => typeof field === "string" && field.trim().length > 0)) {
    invalid(`Stage ${index + 1} requires id, key, and name`);
  }
  if (!workflowStageTypes.includes(type as WorkflowStage["type"])) {
    invalid(`Stage ${index + 1} has an invalid type`);
  }
  if (requiredApprovals !== undefined && (!Number.isInteger(requiredApprovals) || (requiredApprovals as number) < 1)) {
    invalid(`Stage ${index + 1} requiredApprovals must be a positive integer`);
  }
  if (
    slaHours !== undefined &&
    (!Number.isInteger(slaHours) || (slaHours as number) < 1 || (slaHours as number) > 8760)
  ) {
    invalid(`Stage ${index + 1} slaHours must be between 1 and 8760`);
  }
  if (isTerminal !== undefined && typeof isTerminal !== "boolean") {
    invalid(`Stage ${index + 1} isTerminal must be boolean`);
  }
  const parsedRule = parseAssigneeRule(assigneeRule, index);
  if (type === "APPROVAL" && !parsedRule) {
    invalid(`Approval stage ${index + 1} requires assigneeRule`);
  }
  return {
    id: (id as string).trim(),
    key: (key as string).trim(),
    name: (name as string).trim(),
    type: type as WorkflowStage["type"],
    ...(parsedRule ? { assigneeRule: parsedRule } : {}),
    ...(requiredApprovals !== undefined ? { requiredApprovals: requiredApprovals as number } : {}),
    ...(slaHours !== undefined ? { slaHours: slaHours as number } : {}),
    ...(isTerminal !== undefined ? { isTerminal: isTerminal as boolean } : {}),
  };
}

function parseAssigneeRule(value: unknown, index: number): WorkflowStage["assigneeRule"] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value) || !["INITIATOR", "USER_IDS"].includes(value.kind as string)) {
    invalid(`Stage ${index + 1} has an invalid assigneeRule`);
  }
  const rule = value as Record<string, unknown>;
  if (rule.kind === "INITIATOR") {
    return { kind: "INITIATOR" };
  }
  if (
    !Array.isArray(rule.userIds) ||
    !rule.userIds.length ||
    rule.userIds.some((id: unknown) => typeof id !== "string" || !id.trim())
  ) {
    invalid(`Stage ${index + 1} USER_IDS assigneeRule requires userIds`);
  }
  return { kind: "USER_IDS", userIds: [...new Set((rule.userIds as string[]).map((id) => id.trim()))] };
}

function parseTransition(value: unknown, index: number): WorkflowTransition {
  if (!isRecord(value) || typeof value.from !== "string" || typeof value.to !== "string") {
    invalid(`Transition ${index + 1} requires from and to`);
  }
  const transition = value as Record<string, unknown>;
  if (!workflowActions.includes(transition.action as WorkflowTransition["action"])) {
    invalid(`Transition ${index + 1} has an invalid action`);
  }
  const condition = transition.condition;
  if (condition !== undefined) {
    if (
      !isRecord(condition) ||
      typeof condition.field !== "string" ||
      !["EQUALS", "NOT_EQUALS", "EXISTS"].includes(condition.operator as string)
    ) {
      invalid(`Transition ${index + 1} has an invalid declarative condition`);
    }
    const parsedCondition = condition as Record<string, unknown>;
    if (
      parsedCondition.operator !== "EXISTS" &&
      !["string", "number", "boolean"].includes(typeof parsedCondition.value)
    ) {
      invalid(`Transition ${index + 1} condition requires a primitive value`);
    }
  }
  return {
    from: transition.from as string,
    to: transition.to as string,
    action: transition.action as WorkflowTransition["action"],
    ...(condition
      ? {
          condition: {
            field: (condition as Record<string, unknown>).field as string,
            operator: (condition as Record<string, unknown>).operator as "EQUALS" | "NOT_EQUALS" | "EXISTS",
            ...((condition as Record<string, unknown>).value !== undefined
              ? { value: (condition as Record<string, unknown>).value as string | number | boolean }
              : {}),
          },
        }
      : {}),
  };
}
