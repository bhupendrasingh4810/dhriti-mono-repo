"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { DhritiDateField, DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import { Dialog } from "@dhriti/ui/dialog";
import type { WorkWeekPattern, WorkWeekRule, WorkWeekWorkspace } from "@dhriti/types";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { hrmsService } from "@/services/hrms.service";
import { Button, Card } from "./components/ui-primitives";
import {
  nextWorkWeekDay,
  presetWorkWeek,
  workWeekDayClasses,
  workWeekDayLabels,
  workWeekPresets,
} from "./work-week-pattern";
import { WorkWeekAssignmentDialog } from "./work-week-assignment";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const today = () => new Date().toISOString().slice(0, 10);
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to save the work-week configuration.";
type Draft = {
  id?: string;
  revision?: number;
  name: string;
  description: string;
  effectiveFrom: string;
  pattern: WorkWeekPattern;
};

function WorkWeekGrid({
  pattern,
  onChange,
}: {
  pattern: WorkWeekPattern;
  onChange?: (pattern: WorkWeekPattern) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-center text-sm" aria-label="Five-week work pattern">
        <thead className="border-b border-border text-xs uppercase text-text-muted">
          <tr>
            <th className="p-3" scope="col">
              Occurrence
            </th>
            {weekdays.map((day) => (
              <th key={day} scope="col" className="p-3">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pattern.map((week, row) => (
            <tr key={row}>
              <th scope="row" className="p-3 text-text-secondary">
                {row + 1}
              </th>
              {week.map((day, column) => (
                <td key={column} className="p-2">
                  {onChange ? (
                    <button
                      type="button"
                      aria-label={`Occurrence ${row + 1} ${weekdays[column]}: ${workWeekDayLabels[day]}`}
                      title={`${workWeekDayLabels[day]}. Click to change.`}
                      onClick={() =>
                        onChange(
                          pattern.map((items, index) =>
                            index === row
                              ? items.map((value, i) => (i === column ? nextWorkWeekDay(value) : value))
                              : items,
                          ),
                        )
                      }
                      className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${workWeekDayClasses[day]}`}
                    >
                      {day === "WORKING" ? "1" : day === "HALF_DAY" ? "½" : "0"}
                    </button>
                  ) : (
                    <span
                      aria-label={workWeekDayLabels[day]}
                      className={`inline-flex size-8 items-center justify-center rounded-md text-xs font-semibold ${workWeekDayClasses[day]}`}
                    >
                      {day === "WORKING" ? "1" : day === "HALF_DAY" ? "½" : "0"}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkWeekDate({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7));
  return (
    <DhritiDateField
      label="Applies from (UTC)"
      required
      value={value}
      onChange={(value) => onChange(value ?? "")}
      month={month}
      onMonthChange={setMonth}
      open={open}
      onOpenChange={setOpen}
      error={error}
    />
  );
}

/** Feature-only editor: rules use monthly weekday occurrences, never a rolling five-week cycle. */
export function HrmsWorkWeek({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  return <WorkWeekSettings key={organizationId} organizationId={organizationId} onToast={onToast} />;
}

function WorkWeekSettings({
  organizationId,
  onToast,
}: {
  organizationId: string | undefined;
  onToast: (message: string) => void;
}) {
  const { can, loading: accessLoading } = usePermissions();
  const canManage = can("organization.settings.manage");
  const [workspace, setWorkspace] = useState<{ organizationId: string; data: WorkWeekWorkspace } | null>(null);
  const data = workspace && workspace.organizationId === organizationId ? workspace.data : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data?.rules.find((rule) => rule.id === selectedId) ?? data?.rules[0];
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [versionOpen, setVersionOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [confirm, setConfirm] = useState<"delete" | "discard" | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | null>(null);
  const currentDefault = data?.defaults.find((entry) => entry.effectiveFrom.slice(0, 10) <= today());
  const version =
    selected?.versions.find((entry) => entry.id === versionId) ??
    selected?.versions.find((entry) => entry.effectiveFrom.slice(0, 10) <= today()) ??
    selected?.versions[0];

  const load = useCallback(async () => {
    if (!organizationId || !canManage) return;
    setLoading(true);
    setError("");
    try {
      const result = await hrmsService.workWeeks.list(organizationId);
      setWorkspace({ organizationId, data: result });
    } catch (reason) {
      setError(message(reason));
    } finally {
      setLoading(false);
    }
  }, [organizationId, canManage]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load status accompanies this settings fetch
    void load();
  }, [load]);

  const start = (rule?: WorkWeekRule, duplicate = false) => {
    setError("");
    setErrors({});
    const source =
      rule?.versions.find((entry) => entry.id === versionId) ??
      rule?.versions.find((entry) => entry.effectiveFrom.slice(0, 10) <= today()) ??
      rule?.versions[0];
    setDraft({
      ...(rule && !duplicate ? { id: rule.id, revision: rule.revision } : {}),
      name: rule ? `${rule.name}${duplicate ? " (copy)" : ""}` : "Saturday Sunday Off",
      description: rule?.description ?? "",
      effectiveFrom:
        source && source.effectiveFrom.slice(0, 10) > today() ? source.effectiveFrom.slice(0, 10) : today(),
      pattern: source?.pattern ?? presetWorkWeek("Saturday Sunday Off"),
    });
  };
  const update = (patch: Partial<Draft>) => {
    setDraft((value) => (value ? { ...value, ...patch } : null));
    setErrors({});
  };
  const save = async () => {
    if (!organizationId || !draft) return;
    const invalid: Record<string, string> = {};
    if (!draft.name.trim()) invalid.name = "Rule name is required.";
    if (draft.name.trim().length > 120) invalid.name = "Use 120 characters or fewer.";
    if (!draft.effectiveFrom || draft.effectiveFrom < today()) invalid.date = "Choose today or a future date.";
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    setBusy(true);
    setError("");
    try {
      const input = {
        name: draft.name.trim(),
        description: draft.description,
        effectiveFrom: draft.effectiveFrom,
        pattern: draft.pattern,
      };
      if (draft.id && draft.revision) {
        await hrmsService.workWeeks.update(organizationId, draft.id, { ...input, revision: draft.revision });
        setSelectedId(draft.id);
      } else {
        const created = await hrmsService.workWeeks.create(organizationId, input);
        setSelectedId(created.id);
      }
      setDraft(null);
      setVersionId(null);
      await load();
      onToast("Work-week rule saved.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!organizationId || !selected) return;
    setConfirm(null);
    setBusy(true);
    setError("");
    try {
      await hrmsService.workWeeks.remove(organizationId, selected.id);
      setSelectedId(null);
      setVersionId(null);
      await load();
      onToast("Work-week rule deleted.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  };
  const setDefault = async () => {
    if (!organizationId || !selected || !defaultDate) return;
    if (defaultDate < today()) {
      setErrors({ date: "Choose today or a future date." });
      return;
    }
    setBusy(true);
    setError("");
    try {
      await hrmsService.workWeeks.setDefault(organizationId, selected.id, defaultDate);
      setDefaultDate(null);
      await load();
      onToast("Default work week scheduled.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  };

  if (accessLoading)
    return (
      <p role="status" className="p-4 text-text-muted">
        Loading access…
      </p>
    );
  if (!canManage)
    return (
      <p role="alert" className="p-4 text-error">
        Organization settings permission is required to manage work weeks.
      </p>
    );
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Work Week</h1>
          <p className="mt-1 text-sm text-text-secondary">Create work-week rules and assign them to employees.</p>
        </div>
        <div className="flex gap-2">
          <Button icon="plus" onClick={() => start()} disabled={busy || !!draft || loading}>
            Create
          </Button>
          <Button
            variant="secondary"
            onClick={() => setAssigning(true)}
            disabled={busy || !!draft || !data?.rules.length}
          >
            Assign
          </Button>
        </div>
      </header>
      {error && (
        <div role="alert" className="rounded-md border border-error p-3 text-sm text-error">
          {error}
          <button type="button" onClick={() => void load()} className="ml-3 cursor-pointer underline" disabled={busy}>
            Reload
          </button>
        </div>
      )}
      {loading && (
        <p role="status" className="text-sm text-text-muted">
          Loading work-week rules…
        </p>
      )}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,4fr)]">
        <nav aria-label="Work-week rules" className="flex gap-2 overflow-auto lg:flex-col">
          {data?.rules.map((rule) => (
            <button
              type="button"
              key={rule.id}
              disabled={busy || !!draft}
              onClick={() => {
                setSelectedId(rule.id);
                setVersionId(null);
              }}
              aria-current={selected?.id === rule.id ? "true" : undefined}
              className={`shrink-0 cursor-pointer rounded-lg border p-4 text-left disabled:cursor-not-allowed ${selected?.id === rule.id ? "border-brand bg-brand-muted text-brand" : "border-border bg-surface text-text-primary hover:bg-surface-raised"}`}
            >
              <span className="block text-sm font-semibold">{rule.name}</span>
              {currentDefault?.ruleId === rule.id && <span className="text-xs font-semibold">Default · </span>}
              <span className="text-xs text-text-muted">5 occurrence rows</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => start()}
            disabled={busy || !!draft || loading}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand p-3 text-sm font-semibold text-brand disabled:cursor-not-allowed"
          >
            <Plus size={16} aria-hidden="true" />
            Create new rule
          </button>
        </nav>
        <Card className="min-h-0 overflow-y-auto p-5">
          {draft ? (
            <fieldset disabled={busy} className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">
                {draft.id ? "Edit work-week rule" : "Create work-week rule"}
              </h2>
              {!draft.id && (
                <DhritiSelectMenu
                  label="Start from a template"
                  value={null}
                  options={workWeekPresets.map((name) => ({ value: name, label: name }))}
                  open={presetOpen}
                  onOpenChange={setPresetOpen}
                  onChange={(name) => {
                    if (name) update({ name, pattern: presetWorkWeek(name) });
                  }}
                />
              )}
              <DhritiTextField
                label="Rule name"
                required
                value={draft.name}
                onChange={(name) => update({ name })}
                error={errors.name}
                maxLength={120}
              />
              <DhritiTextField
                label="Description"
                value={draft.description}
                onChange={(description) => update({ description })}
                maxLength={2000}
              />
              <WorkWeekDate
                value={draft.effectiveFrom}
                onChange={(effectiveFrom) => update({ effectiveFrom })}
                error={errors.date}
              />
              <p className="text-xs text-text-muted">
                Rows are the first through fifth occurrence of each weekday in a month. Click to cycle: working day →
                half day → weekly off. Half days count as 0.5 day; shift hours do not change.
              </p>
              <fieldset disabled={busy}>
                <WorkWeekGrid pattern={draft.pattern} onChange={(pattern) => update({ pattern })} />
              </fieldset>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setConfirm("discard")} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={() => void save()} disabled={busy}>
                  {busy ? "Saving…" : "Save rule"}
                </Button>
              </div>
            </fieldset>
          ) : selected && version ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{selected.name}</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {selected.description || "Monthly weekday-occurrence pattern."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setErrors({});
                      setDefaultDate(today());
                    }}
                    disabled={busy}
                  >
                    <Star size={14} aria-hidden="true" />
                    Set as default
                  </Button>
                  <Button variant="secondary" onClick={() => start(selected, true)} disabled={busy}>
                    <Copy size={14} aria-hidden="true" />
                    Duplicate
                  </Button>
                  <button
                    type="button"
                    aria-label="Edit work-week rule"
                    onClick={() => start(selected)}
                    disabled={busy}
                    className="cursor-pointer rounded-md p-2 text-brand hover:bg-brand-muted"
                  >
                    <Pencil size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete work-week rule"
                    onClick={() => setConfirm("delete")}
                    disabled={busy}
                    className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <DhritiSelectMenu
                label="Pattern version"
                value={version.id}
                options={selected.versions.map((entry) => ({
                  value: entry.id,
                  label: `Applies from ${entry.effectiveFrom.slice(0, 10)}`,
                }))}
                open={versionOpen}
                onOpenChange={setVersionOpen}
                onChange={setVersionId}
              />
              <WorkWeekGrid pattern={version.pattern} />
              <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                {(["WORKING", "OFF", "HALF_DAY"] as const).map((kind) => (
                  <span key={kind} className="flex items-center gap-2">
                    <span className={`size-3 rounded-sm ${workWeekDayClasses[kind]}`} />
                    {workWeekDayLabels[kind]}
                  </span>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                Changes apply from the chosen date. Earlier schedules and submitted leave remain unchanged. Named rule
                changes affect employees assigned to that rule.
              </p>
              <section className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-text-primary">Default schedule history</h3>
                <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                  {data?.defaults.map((entry) => (
                    <li key={entry.id}>
                      {entry.effectiveFrom.slice(0, 10)} · {data.rules.find((rule) => rule.id === entry.ruleId)?.name}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            !loading &&
            !error && (
              <div className="space-y-3 p-4">
                <h2 className="font-semibold text-text-primary">No work-week rules yet</h2>
                <p className="text-sm text-text-secondary">
                  Create a rule from a template. Your existing working days continue until a new default or assignment
                  takes effect. The original schedule is preserved automatically.
                </p>
              </div>
            )
          )}
        </Card>
      </div>
      <ConfirmationDialog
        open={confirm === "discard"}
        title="Discard work-week changes?"
        description="Your unsaved rule changes will be lost."
        confirmLabel="Discard"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setDraft(null);
          setConfirm(null);
        }}
      />
      <ConfirmationDialog
        open={confirm === "delete"}
        title="Delete work-week rule?"
        description="Rules used in default or employee assignment history cannot be deleted."
        confirmLabel="Delete"
        confirmColor="error"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void remove()}
      />
      {defaultDate !== null && (
        <Dialog
          open
          title="Set default work week"
          onClose={() => {
            if (!busy) setDefaultDate(null);
          }}
          primaryActionLabel="Set default"
          onPrimaryAction={setDefault}
          isSubmitting={busy}
        >
          <p className="text-sm text-text-secondary">
            Employees without an explicit assignment follow this default from the selected date.
          </p>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <fieldset disabled={busy}>
            <WorkWeekDate value={defaultDate} onChange={setDefaultDate} error={errors.date} />
          </fieldset>
        </Dialog>
      )}
      {assigning && organizationId && data && (
        <WorkWeekAssignmentDialog
          organizationId={organizationId}
          rules={data.rules}
          selectedRuleId={selected?.id ?? null}
          onClose={() => setAssigning(false)}
          onDone={() => {
            setAssigning(false);
            onToast("Employee work-week assignments saved.");
          }}
        />
      )}
    </div>
  );
}
