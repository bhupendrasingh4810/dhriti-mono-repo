"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Archive, ClipboardList, Plus, Rocket, Trash2, X } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import {
  hrmsService,
  type HrmsWorkflowDefinition,
  type HrmsWorkflowDefinitionInput,
  type HrmsWorkflowStage,
  type HrmsWorkflowTransition,
} from "@/services/hrms.service";

type WorkflowForm = HrmsWorkflowDefinitionInput;

const emptyWorkflow: WorkflowForm = {
  name: "",
  description: "",
  stages: [
    {
      id: "request",
      key: "request",
      name: "Request submitted",
      type: "TASK",
      assigneeRule: { kind: "INITIATOR" },
      isTerminal: true,
    },
  ],
  transitions: [],
};

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : "Unable to complete the workflow request. Please try again.";
}

function transitionsFor(stages: HrmsWorkflowStage[]): HrmsWorkflowTransition[] {
  return stages.slice(0, -1).map((stage, index) => ({ from: stage.id, to: stages[index + 1].id, action: "COMPLETE" }));
}

function toForm(workflow: HrmsWorkflowDefinition): WorkflowForm {
  const stages = workflow.stages.map((stage, index) => ({
    ...stage,
    key: stage.key || `stage-${index + 1}`,
    type: stage.type ?? "APPROVAL",
    assigneeRule: stage.assigneeRule ?? { kind: "INITIATOR" },
    requiredApprovals: stage.requiredApprovals ?? 1,
    isTerminal: index === workflow.stages.length - 1,
  }));
  return {
    name: workflow.name,
    description: workflow.description ?? "",
    stages,
    transitions: workflow.transitions.length > 0 ? workflow.transitions : transitionsFor(stages),
  };
}

function StatusBadge({ status }: { status: HrmsWorkflowDefinition["status"] }) {
  const tone = {
    ACTIVE: "bg-success/10 text-success",
    DRAFT: "bg-warning/10 text-warning",
    ARCHIVED: "bg-surface-raised text-text-muted",
  }[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

export function WorkflowSetting() {
  const { user } = useAuth();
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const router = useRouter();
  const organizationId = user?.organization?.id;
  const [workflows, setWorkflows] = useState<HrmsWorkflowDefinition[]>([]);
  const [templates, setTemplates] = useState<HrmsWorkflowDefinition[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError("");
    try {
      const definitions = await hrmsService.workflowDefinitions.list(organizationId, { isTemplate: false });
      setWorkflows(definitions);
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openTemplateDialog = async () => {
    if (!organizationId) return;
    setError("");
    setTemplateDialogOpen(true);
    setLoadingTemplates(true);
    try {
      setTemplates(await hrmsService.workflowDefinitions.listTemplates(organizationId));
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoadingTemplates(false);
    }
  };

  const createWorkflow = (templateId?: string) => {
    const createPath = `/${organizationSlug}/hrms/settings/workflow/create`;
    router.push(templateId ? `${createPath}?templateId=${encodeURIComponent(templateId)}` : createPath);
  };

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workflows</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure versioned HRMS approvals and operational processes for this organization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void openTemplateDialog()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-text-inverse shadow-sm transition hover:bg-brand-dark"
        >
          <Plus aria-hidden="true" size={16} />
          Create Workflow
        </button>
      </header>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-error px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold text-text-primary">Organization workflows</h2>
          <p className="mt-1 text-xs text-text-muted">
            Drafts can be edited. Active workflows retain their published version.
          </p>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-text-muted">Loading workflows...</p>
        ) : workflows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-text-muted">
            No organization workflows yet. Create one to configure your first approval process.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {workflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={`/${organizationSlug}/hrms/settings/workflow/${workflow.id}`}
                className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition hover:bg-surface-raised"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-text-primary">{workflow.name}</span>
                  <span className="mt-1 block text-xs text-text-muted">
                    {workflow.stages.length} stages · Version {workflow.version}
                  </span>
                </span>
                <StatusBadge status={workflow.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {templateDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 p-4 backdrop-blur-sm"
          onClick={() => setTemplateDialogOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="workflow-template-title"
            className="max-h-full w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <h2 id="workflow-template-title" className="font-display text-lg font-bold text-text-primary">
                  Choose a workflow starting point
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Select a default template or build a workflow from scratch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateDialogOpen(false)}
                className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-surface-raised hover:text-text-primary"
                aria-label="Close workflow template dialog"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </header>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              {loadingTemplates ? (
                <p className="col-span-full py-8 text-center text-sm text-text-muted">Loading default templates...</p>
              ) : templates.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-text-muted">
                  Default templates are not available for this organization.
                </p>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => createWorkflow(template.id)}
                    className="cursor-pointer rounded-lg border border-border p-4 text-left transition hover:border-brand hover:bg-surface-raised"
                  >
                    <ClipboardList aria-hidden="true" className="text-brand" size={20} />
                    <span className="mt-3 block text-sm font-semibold text-text-primary">{template.name}</span>
                    <span className="mt-1 block text-xs text-text-muted">
                      {template.stages.length} predefined stages
                    </span>
                  </button>
                ))
              )}
            </div>
            <footer className="flex justify-end border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={() => createWorkflow()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-dark"
              >
                <Plus aria-hidden="true" size={16} />
                Proceed with custom workflow
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}

export function WorkflowDefinitionEditor({ workflowId }: { workflowId?: string }) {
  const { user } = useAuth();
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = user?.organization?.id;
  const templateId = searchParams.get("templateId");
  const [workflow, setWorkflow] = useState<HrmsWorkflowDefinition | null>(null);
  const [form, setForm] = useState<WorkflowForm>(emptyWorkflow);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(Boolean(workflowId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    const timer = window.setTimeout(() => {
      const load = async () => {
        setRequestError("");
        setLoading(Boolean(workflowId));
        try {
          if (workflowId) {
            const definition = await hrmsService.workflowDefinitions.get(organizationId, workflowId);
            setWorkflow(definition);
            setForm(toForm(definition));
          } else if (templateId) {
            const templates = await hrmsService.workflowDefinitions.listTemplates(organizationId);
            const template = templates.find((candidate) => candidate.id === templateId);
            if (!template) {
              throw new Error("The selected workflow template is unavailable.");
            }
            setForm(toForm(template));
          }
        } catch (error) {
          setRequestError(messageFor(error));
        } finally {
          setLoading(false);
        }
      };
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [organizationId, templateId, workflowId]);

  const updateStage = (index: number, name: string) => {
    setForm((current) => {
      const stages = current.stages.map((stage, stageIndex) => ({
        ...stage,
        name: stageIndex === index ? name : stage.name,
      }));
      return { ...current, stages };
    });
    setErrors((current) => ({ ...current, stages: "" }));
  };

  const updateStageConfig = <K extends keyof HrmsWorkflowStage>(
    index: number,
    field: K,
    value: HrmsWorkflowStage[K],
  ) => {
    setForm((current) => ({
      ...current,
      stages: current.stages.map((stage, stageIndex) => (stageIndex === index ? { ...stage, [field]: value } : stage)),
    }));
  };

  const addStage = () => {
    setForm((current) => {
      const stages = [
        ...current.stages.map((stage) => ({ ...stage, isTerminal: false })),
        {
          id: `stage-${Date.now()}`,
          key: `stage-${Date.now()}`,
          name: "",
          type: "APPROVAL" as const,
          assigneeRule: { kind: "INITIATOR" as const },
          requiredApprovals: 1,
          isTerminal: true,
        },
      ];
      return {
        ...current,
        stages,
        transitions: [
          ...current.transitions,
          { from: stages[stages.length - 2].id, to: stages[stages.length - 1].id, action: "APPROVE" },
        ],
      };
    });
  };

  const removeStage = (index: number) => {
    setForm((current) => {
      const stages = current.stages
        .filter((_, stageIndex) => stageIndex !== index)
        .map((stage, stageIndex, all) => ({ ...stage, isTerminal: stageIndex === all.length - 1 }));
      const stageIds = new Set(stages.map((stage) => stage.id));
      const transitions = current.transitions.filter(
        (transition) => stageIds.has(transition.from) && stageIds.has(transition.to),
      );
      return {
        ...current,
        stages,
        transitions: transitions.length > 0 || stages.length < 2 ? transitions : transitionsFor(stages),
      };
    });
  };

  const updateTransition = (index: number, action: HrmsWorkflowTransition["action"]) => {
    setForm((current) => ({
      ...current,
      transitions: current.transitions.map((transition, transitionIndex) =>
        transitionIndex === index ? { ...transition, action } : transition,
      ),
    }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Workflow name is required.";
    if (form.stages.length === 0) next.stages = "Add at least one stage.";
    if (form.stages.some((stage) => !stage.name.trim())) next.stages = "Every stage needs a name.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!organizationId || !validate()) return;
    setSaving(true);
    setRequestError("");
    setSuccess("");
    try {
      const input = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim(),
        transitions: form.transitions,
      };
      if (workflowId) {
        const updated = await hrmsService.workflowDefinitions.update(organizationId, workflowId, input);
        setWorkflow(updated);
        setForm(toForm(updated));
        setSuccess("Draft saved.");
      } else {
        const created = await hrmsService.workflowDefinitions.create(organizationId, input);
        router.replace(`/${organizationSlug}/hrms/settings/workflow/${created.id}`);
      }
    } catch (error) {
      setRequestError(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!organizationId || !workflowId || !validate()) return;
    setSaving(true);
    setRequestError("");
    try {
      await hrmsService.workflowDefinitions.update(organizationId, workflowId, {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim(),
        transitions: form.transitions,
      });
      const published = await hrmsService.workflowDefinitions.publish(organizationId, workflowId);
      setWorkflow(published);
      setForm(toForm(published));
      setSuccess("Workflow published.");
    } catch (error) {
      setRequestError(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!organizationId || !workflowId) return;
    setSaving(true);
    setRequestError("");
    try {
      const archived = await hrmsService.workflowDefinitions.update(organizationId, workflowId, { status: "ARCHIVED" });
      setWorkflow(archived);
      setSuccess("Workflow archived.");
    } catch (error) {
      setRequestError(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  const title = workflow ? workflow.name : "Create Workflow";
  const canEdit = !workflow || workflow.status === "DRAFT";
  const stageSummary = useMemo(
    () => form.stages.map((stage) => stage.name || "Untitled stage").join(" → "),
    [form.stages],
  );

  return (
    <section className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-secondary">
        <Link href={`/${organizationSlug}/hrms`} className="cursor-pointer hover:text-text-primary">
          HRMS
        </Link>
        <span className="px-2 text-text-muted">/</span>
        <Link href={`/${organizationSlug}/hrms/settings/workflow`} className="cursor-pointer hover:text-text-primary">
          Settings
        </Link>
        <span className="px-2 text-text-muted">/</span>
        <Link href={`/${organizationSlug}/hrms/settings`} className="cursor-pointer hover:text-text-primary">
          Workflows
        </Link>
        <span className="px-2 text-text-muted">/</span>
        <span aria-current="page" className="font-semibold text-text-primary">
          {title}
        </span>
      </nav>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
            {workflow && <StatusBadge status={workflow.status} />}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {workflow
              ? `Version ${workflow.version}. ${canEdit ? "Edit the draft before publishing." : "Active versions are read-only."}`
              : "Configure the stages, assignees, and transitions for this workflow."}
          </p>
        </div>
        <Link
          href={`/${organizationSlug}/hrms/settings/workflow`}
          className="cursor-pointer text-sm font-semibold text-brand hover:text-brand-dark"
        >
          Back to workflows
        </Link>
      </header>

      {requestError && (
        <p role="alert" className="mb-4 rounded-md border border-error px-3 py-2 text-sm text-error">
          {requestError}
        </p>
      )}
      {success && (
        <p role="status" className="mb-4 rounded-md border border-success px-3 py-2 text-sm text-success">
          {success}
        </p>
      )}

      {loading ? (
        <p className="rounded-lg border border-border bg-surface px-5 py-8 text-sm text-text-muted">
          Loading workflow...
        </p>
      ) : (
        <form onSubmit={save} className="space-y-5">
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-text-primary">
                Workflow name <span className="text-error">*</span>
              </span>
              <input
                value={form.name}
                disabled={!canEdit}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setErrors((current) => ({ ...current, name: "" }));
                }}
                className={`w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-70 ${errors.name ? "border-error" : "border-border"}`}
              />
              {errors.name && <span className="mt-1 block text-xs text-error">{errors.name}</span>}
            </label>
            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm font-semibold text-text-primary">Description</span>
              <textarea
                rows={3}
                value={form.description}
                disabled={!canEdit}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>
          </section>

          <section className="rounded-lg border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold text-text-primary">Stages</h2>
                <p className="mt-1 text-xs text-text-muted">{stageSummary}</p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={addStage}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  <Plus aria-hidden="true" size={16} /> Add stage
                </button>
              )}
            </div>
            <ol className="divide-y divide-border">
              {form.stages.map((stage, index) => (
                <li key={stage.id} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-muted text-xs font-bold text-brand">
                      {index + 1}
                    </span>
                    <input
                      value={stage.name}
                      disabled={!canEdit}
                      onChange={(event) => updateStage(index, event.target.value)}
                      className={`min-w-0 flex-1 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-70 ${errors.stages ? "border-error" : "border-border"}`}
                      aria-label={`Stage ${index + 1} name`}
                    />
                    {canEdit && form.stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStage(index)}
                        className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-surface-raised hover:text-error"
                        aria-label={`Remove ${stage.name || `stage ${index + 1}`}`}
                      >
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    )}
                  </div>
                  <div className="ml-10 mt-3 grid gap-3 md:grid-cols-4">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-text-secondary">Stage type</span>
                      <select
                        value={stage.type}
                        disabled={!canEdit}
                        onChange={(event) =>
                          updateStageConfig(index, "type", event.target.value as HrmsWorkflowStage["type"])
                        }
                        className="w-full rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <option value="APPROVAL">Approval</option>
                        <option value="TASK">Task</option>
                        <option value="AUTOMATION">Automation</option>
                        <option value="CONDITION">Condition</option>
                        <option value="PARALLEL_GATE">Parallel gate</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-text-secondary">Assignee rule</span>
                      <select
                        value={stage.assigneeRule?.kind}
                        disabled={!canEdit}
                        onChange={(event) =>
                          updateStageConfig(index, "assigneeRule", {
                            kind: event.target.value as NonNullable<HrmsWorkflowStage["assigneeRule"]>["kind"],
                          })
                        }
                        className="w-full rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <option value="INITIATOR">Initiator</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-text-secondary">Required approvals</span>
                      <input
                        type="number"
                        min="1"
                        value={stage.requiredApprovals ?? 1}
                        disabled={!canEdit}
                        onChange={(event) => updateStageConfig(index, "requiredApprovals", Number(event.target.value))}
                        className="w-full rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-text-secondary">SLA (hours)</span>
                      <input
                        type="number"
                        min="1"
                        value={stage.slaHours ?? ""}
                        disabled={!canEdit}
                        onChange={(event) =>
                          updateStageConfig(
                            index,
                            "slaHours",
                            event.target.value ? Number(event.target.value) : undefined,
                          )
                        }
                        className="w-full rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-70"
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ol>
            {errors.stages && <p className="px-5 pb-4 text-xs text-error">{errors.stages}</p>}
          </section>

          <section className="rounded-lg border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-semibold text-text-primary">Transitions</h2>
              <p className="mt-1 text-xs text-text-muted">Define the action that moves an instance between stages.</p>
            </div>
            {form.transitions.length === 0 ? (
              <p className="px-5 py-5 text-sm text-text-muted">Add another stage to create a transition.</p>
            ) : (
              <ul className="divide-y divide-border">
                {form.transitions.map((transition, index) => {
                  const from = form.stages.find((stage) => stage.id === transition.from)?.name ?? "Unknown stage";
                  const to = form.stages.find((stage) => stage.id === transition.to)?.name ?? "Unknown stage";
                  return (
                    <li
                      key={`${transition.from}-${transition.to}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    >
                      <p className="text-sm text-text-secondary">
                        <span className="font-semibold text-text-primary">{from}</span>
                        <span className="px-2 text-text-muted">→</span>
                        <span className="font-semibold text-text-primary">{to}</span>
                      </p>
                      <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                        Action
                        <select
                          value={transition.action ?? "COMPLETE"}
                          disabled={!canEdit}
                          onChange={(event) =>
                            updateTransition(index, event.target.value as HrmsWorkflowTransition["action"])
                          }
                          className="rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <option value="APPROVE">Approve</option>
                          <option value="REJECT">Reject</option>
                          <option value="COMPLETE">Complete</option>
                          <option value="SKIP">Skip</option>
                        </select>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-md border border-border px-3.5 py-2 text-sm font-semibold text-text-secondary transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save draft
              </button>
            )}
            {workflow?.status === "DRAFT" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void publish()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-text-inverse shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Rocket aria-hidden="true" size={16} /> Publish
              </button>
            )}
            {workflow && workflow.status !== "ARCHIVED" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void archive()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-error px-3.5 py-2 text-sm font-semibold text-error transition hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Archive aria-hidden="true" size={16} /> Archive
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
