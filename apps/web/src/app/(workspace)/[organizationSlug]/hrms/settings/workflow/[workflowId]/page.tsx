"use client";

import { useParams } from "next/navigation";

import { WorkflowDefinitionEditor } from "@/features/hrms/workflows/WorkflowSetting";

export default function WorkflowDefinitionPage() {
  const { workflowId } = useParams<{ workflowId: string }>();

  return <WorkflowDefinitionEditor workflowId={workflowId} />;
}
