"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DhritiTextField } from "@dhriti/ui";
import { Dialog } from "@dhriti/ui/dialog";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  recruitmentService,
  type RecruitmentRole,
  type RecruitmentStage,
  type RecruitmentCandidate,
  type CandidateDetails,
  type JobOpeningPage,
  type RecruitmentAssignee,
  type RecruitmentMember,
} from "@/services/hrms-recruitment.service";
import { Button, Card } from "./components/ui-primitives";

const errorMessage = (reason: unknown) => (reason instanceof Error ? reason.message : "Unable to update recruitment.");
const selectClass =
  "mt-1 w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary";

export function RecruitmentCandidates({
  organizationId,
  role,
  admin,
  mode,
  openingId,
}: {
  organizationId: string;
  role: RecruitmentRole;
  admin: boolean;
  mode: "pipeline" | "interviews";
  openingId?: string;
}) {
  const [refresh, setRefresh] = useState(0);
  const [stages, setStages] = useState<RecruitmentStage[]>([]);
  const [result, setResult] = useState<{
    key: string;
    items?: RecruitmentCandidate[];
    total?: number;
    error?: string;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingStage, setAddingStage] = useState(false);
  const [editingStage, setEditingStage] = useState<RecruitmentStage | null>(null);
  const [deletingStage, setDeletingStage] = useState<RecruitmentStage | null>(null);
  const [rejecting, setRejecting] = useState<RecruitmentCandidate | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = `${organizationId}:${mode}:${openingId ?? ""}:${refresh}`;
  useEffect(() => {
    let active = true;
    Promise.all([
      recruitmentService.stages(organizationId),
      recruitmentService.board(organizationId, openingId, mode === "interviews"),
    ])
      .then(([nextStages, data]) => {
        if (active) {
          setStages(nextStages);
          setResult({ key, items: data });
        }
      })
      .catch((reason: unknown) => {
        if (active) setResult({ key, error: errorMessage(reason) });
      });
    return () => {
      active = false;
    };
  }, [organizationId, openingId, mode, key]);
  const current = result?.key === key ? result : null;
  const reload = () => setRefresh((value) => value + 1);
  const move = async (candidate: RecruitmentCandidate, stageId: string) => {
    if (busy || candidate.stageId === stageId || candidate.stage.systemKey === "HIRED") return;
    setBusy(true);
    setError("");
    try {
      await recruitmentService.move(organizationId, candidate, stageId);
      reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
      setDragged(null);
    }
  };
  const reorder = async (index: number, direction: -1 | 1) => {
    const reordered = [...stages];
    const target = index + direction;
    if (busy || index <= 0 || target <= 0 || index >= stages.length - 1 || target >= stages.length - 1) return;
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBusy(true);
    setError("");
    try {
      await recruitmentService.reorderStages(
        organizationId,
        reordered.map((stage) => stage.id),
        stages.map((stage) => stage.id),
      );
      reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={mode === "pipeline" ? "flex min-h-0 flex-1 flex-col gap-4" : "space-y-4"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">
          {openingId ? "Applicants" : mode === "pipeline" ? "Candidate pipeline" : "Interviews"}
        </h2>
        <div className="flex gap-2">
          {admin && mode === "pipeline" && (
            <Button variant="secondary" onClick={() => setAddingStage(true)}>
              Add stage
            </Button>
          )}
          {role === "MANAGER" && !openingId && (
            <Button icon="plus" onClick={() => setCreating(true)}>
              Add candidate
            </Button>
          )}
        </div>
      </div>
      {mode === "interviews" && !openingId && (
        <p className="text-sm text-text-secondary">
          This list includes active and closed candidates. Interview scheduling is not available yet.
        </p>
      )}
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      {current?.error ? (
        <div>
          <p role="alert" className="text-error">
            {current.error}
          </p>
          <Button variant="secondary" onClick={reload}>
            Retry candidates
          </Button>
        </div>
      ) : !current?.items ? (
        <p role="status">Loading candidates…</p>
      ) : (
        <>
          {mode === "pipeline" ? (
            <div className="min-h-0 flex-1 overflow-x-auto pb-2">
              <div className="flex h-full min-h-full items-stretch gap-3">
                {stages.map((stage, index) => (
                  <section
                    key={stage.id}
                    aria-label={`${stage.name} candidates`}
                    className="w-56 shrink-0 overflow-y-auto rounded-lg bg-surface-raised p-3"
                    onDragOver={(event) => {
                      if (dragged) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const candidate = current.items?.find((item) => item.id === dragged);
                      if (candidate) void move(candidate, stage.id);
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-1">
                      <h3 className="min-w-0 break-words text-sm font-semibold text-text-primary">{stage.name}</h3>
                      {admin && (
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            aria-label={`Move ${stage.name} left`}
                            disabled={busy || index <= 1 || index === stages.length - 1}
                            onClick={() => void reorder(index, -1)}
                            className="cursor-pointer rounded p-1 text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronLeft size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${stage.name} right`}
                            disabled={busy || index === 0 || index >= stages.length - 2}
                            onClick={() => void reorder(index, 1)}
                            className="cursor-pointer rounded p-1 text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronRight size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Edit ${stage.name}`}
                            onClick={() => setEditingStage(stage)}
                            className="cursor-pointer rounded p-1 text-text-secondary"
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          {!stage.systemKey && (
                            <button
                              type="button"
                              aria-label={`Delete ${stage.name}`}
                              onClick={() => setDeletingStage(stage)}
                              className="cursor-pointer rounded p-1 text-error"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {current.items
                        ?.filter((item) => item.stageId === stage.id)
                        .map((candidate) => (
                          <div key={candidate.id} className="rounded-md border border-border bg-surface shadow-sm">
                            <button
                              type="button"
                              draggable={!busy && candidate.stage.systemKey !== "HIRED"}
                              onDragStart={() => setDragged(candidate.id)}
                              onDragEnd={() => setDragged(null)}
                              onClick={() => setSelected(candidate.id)}
                              className="w-full cursor-pointer rounded-md p-3 text-left hover:bg-surface-raised"
                            >
                              <span className="block font-semibold text-text-primary">{candidate.name}</span>
                              <span className="block text-xs text-text-secondary">{candidate.opening.title}</span>
                              {candidate.interviewFeedback[0] && (
                                <span className="block text-xs text-text-secondary">
                                  Interview: {candidate.interviewFeedback[0].verdict === "PASSED" ? "Passed" : "Failed"}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejecting(candidate)}
                              className="cursor-pointer px-3 pb-3 text-sm text-error"
                            >
                              Reject candidate
                            </button>
                          </div>
                        ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <Card className="overflow-hidden">
              {!current.items.length ? (
                <p className="p-4 text-sm text-text-secondary">No candidates to show.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {current.items.map((candidate) => (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(candidate.id)}
                        className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-surface-raised"
                      >
                        <span className="font-semibold">{candidate.name}</span>
                        <span className="text-sm text-text-secondary">
                          {candidate.opening.title} ·{" "}
                          {candidate.outcome === "JOINED"
                            ? "Joined"
                            : candidate.outcome === "OFFER_DECLINED"
                              ? "Offer declined"
                              : candidate.outcome === "REJECTED"
                                ? "Rejected"
                                : candidate.stage.name}
                          {candidate.interviewFeedback[0] && (
                            <>
                              {" "}
                              · Interview: {candidate.interviewFeedback[0].verdict === "PASSED" ? "Passed" : "Failed"}
                            </>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </>
      )}
      {selected && (
        <CandidateDialog
          organizationId={organizationId}
          candidateId={selected}
          role={role}
          stages={stages}
          onClose={() => setSelected(null)}
          onChanged={reload}
          onReject={(candidate) => {
            setSelected(null);
            setRejecting(candidate);
          }}
        />
      )}
      {creating && (
        <CandidateForm
          organizationId={organizationId}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      {addingStage && (
        <StageForm
          organizationId={organizationId}
          onClose={() => setAddingStage(false)}
          onSaved={() => {
            setAddingStage(false);
            reload();
          }}
        />
      )}
      {editingStage && (
        <StageForm
          organizationId={organizationId}
          stage={editingStage}
          onClose={() => setEditingStage(null)}
          onSaved={() => {
            setEditingStage(null);
            reload();
          }}
        />
      )}
      {deletingStage && (
        <Dialog
          open
          title={`Delete ${deletingStage.name}?`}
          onClose={() => setDeletingStage(null)}
          primaryActionLabel="Delete stage"
          primaryButtonColor="error"
          isSubmitting={busy}
          onPrimaryAction={async () => {
            setBusy(true);
            setError("");
            try {
              await recruitmentService.deleteStage(organizationId, deletingStage.id);
              setDeletingStage(null);
              reload();
            } catch (reason) {
              setError(errorMessage(reason));
              setDeletingStage(null);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>Stages containing candidates, including historical records, cannot be deleted.</p>
        </Dialog>
      )}
      {rejecting && (
        <RejectForm
          candidate={rejecting}
          organizationId={organizationId}
          onClose={() => setRejecting(null)}
          onSaved={() => {
            setRejecting(null);
            setSelected(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function StageForm({
  organizationId,
  stage,
  onClose,
  onSaved,
}: {
  organizationId: string;
  stage?: RecruitmentStage;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(stage?.name ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!name.trim()) {
      setError("Stage name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (stage) await recruitmentService.renameStage(organizationId, stage.id, name);
      else await recruitmentService.addStage(organizationId, name);
      onSaved();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      title={stage ? "Edit pipeline stage" : "Add pipeline stage"}
      onClose={onClose}
      onPrimaryAction={save}
      primaryActionLabel={stage ? "Save stage" : "Add stage"}
      isSubmitting={busy}
    >
      <DhritiTextField label="Stage name" required value={name} onChange={setName} error={error} maxLength={80} />
    </Dialog>
  );
}

function RejectForm({
  organizationId,
  candidate,
  onClose,
  onSaved,
}: {
  organizationId: string;
  candidate: RecruitmentCandidate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await recruitmentService.reject(organizationId, candidate, reason);
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      title={`Reject ${candidate.name}`}
      onClose={onClose}
      onPrimaryAction={save}
      primaryActionLabel="Reject candidate"
      primaryButtonColor="error"
      isSubmitting={busy}
    >
      <DhritiTextField
        label="Rejection reason"
        required
        value={reason}
        onChange={setReason}
        error={error}
        maxLength={5000}
      />
    </Dialog>
  );
}

function CandidateForm({
  organizationId,
  onClose,
  onSaved,
}: {
  organizationId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [page, setPage] = useState(1);
  const [openings, setOpenings] = useState<JobOpeningPage | null>(null);
  const [openingId, setOpeningId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    recruitmentService
      .openings(organizationId, page)
      .then((value) => {
        if (active) setOpenings(value);
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason));
      });
    return () => {
      active = false;
    };
  }, [organizationId, page]);
  const save = async () => {
    const invalid: Record<string, string> = {};
    if (!openingId) invalid.opening = "Select an open job opening.";
    if (!name.trim()) invalid.name = "Candidate name is required.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.email = "Enter a valid email address.";
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    setBusy(true);
    setError("");
    try {
      await recruitmentService.createCandidate(organizationId, {
        openingId,
        name,
        email,
        ...(phone.trim() ? { phone } : {}),
      });
      onSaved();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      title="Add candidate"
      maxWidth="md"
      onClose={onClose}
      onPrimaryAction={save}
      primaryActionLabel="Add candidate"
      isSubmitting={busy}
    >
      <div className="max-h-[65vh] space-y-4 overflow-y-auto">
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
        <label className="block text-sm font-semibold text-text-secondary">
          Open job opening <span className="text-error">*</span>
          <select
            className={`${selectClass} ${errors.opening ? "border-error" : ""}`}
            value={openingId}
            onChange={(event) => setOpeningId(event.target.value)}
            aria-invalid={!!errors.opening}
          >
            <option value="">Select an opening</option>
            {openings?.items
              .filter((opening) => opening.status === "OPEN")
              .map((opening) => (
                <option key={opening.id} value={opening.id}>
                  {opening.title}
                </option>
              ))}
          </select>
        </label>
        {errors.opening && (
          <p role="alert" className="text-sm text-error">
            {errors.opening}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => {
              setOpeningId("");
              setPage(page - 1);
            }}
          >
            Previous openings
          </Button>
          <Button
            variant="secondary"
            disabled={!openings || page * 20 >= openings.total}
            onClick={() => {
              setOpeningId("");
              setPage(page + 1);
            }}
          >
            Next openings
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <DhritiTextField
            label="Candidate name"
            required
            value={name}
            onChange={setName}
            error={errors.name}
            maxLength={200}
          />
          <DhritiTextField
            label="Email"
            required
            value={email}
            onChange={setEmail}
            error={errors.email}
            maxLength={320}
          />
          <DhritiTextField label="Phone" value={phone} onChange={setPhone} maxLength={40} />
        </div>
      </div>
    </Dialog>
  );
}

function CandidateDialog({
  organizationId,
  candidateId,
  role,
  stages,
  onClose,
  onChanged,
  onReject,
}: {
  organizationId: string;
  candidateId: string;
  role: RecruitmentRole;
  stages: RecruitmentStage[];
  onClose: () => void;
  onChanged: () => void;
  onReject: (candidate: RecruitmentCandidate) => void;
}) {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const [candidate, setCandidate] = useState<CandidateDetails | null>(null);
  const [assignees, setAssignees] = useState<RecruitmentAssignee[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [stageId, setStageId] = useState("");
  const [assigned, setAssigned] = useState("");
  const [busy, setBusy] = useState(false);
  const [interviewers, setInterviewers] = useState<RecruitmentMember[]>([]);
  const [interviewerError, setInterviewerError] = useState("");
  const [interviewerQuery, setInterviewerQuery] = useState("");
  const [interviewerPage, setInterviewerPage] = useState(1);
  const [interviewer, setInterviewer] = useState("");
  useEffect(() => {
    if (role !== "MANAGER") return;
    let active = true;
    recruitmentService
      .interviewers(organizationId, interviewerQuery, interviewerPage)
      .then((people) => {
        if (active) {
          setInterviewers(people);
          setInterviewerError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) setInterviewerError(errorMessage(reason));
      });
    return () => {
      active = false;
    };
  }, [organizationId, role, interviewerQuery, interviewerPage]);
  useEffect(() => {
    let active = true;
    Promise.all([
      recruitmentService.candidate(organizationId, candidateId),
      role === "MANAGER" ? recruitmentService.assignees(organizationId) : Promise.resolve([]),
    ])
      .then(([data, people]) => {
        if (active) {
          setCandidate(data);
          setAssignees(people);
          setStageId(data.stageId);
          setAssigned(data.assignedUserId ?? "");
          setInterviewer(data.interviewerUserId ?? "");
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason));
      });
    return () => {
      active = false;
    };
  }, [organizationId, candidateId, role, refresh]);
  const perform = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      setComment("");
      setRefresh((value) => value + 1);
      onChanged();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open title="Candidate details" onClose={onClose} maxWidth="lg">
      <div className="max-h-[65vh] space-y-4 overflow-y-auto">
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
        {!candidate ? (
          <p role="status">Loading candidate…</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <section aria-label="Candidate information" className="min-w-0 space-y-4">
              <div>
                <p className="font-semibold">{candidate.name}</p>
                <p className="text-sm text-text-secondary">
                  {candidate.opening.title} · {candidate.email}
                  {candidate.phone ? ` · ${candidate.phone}` : ""}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Job description</h3>
                <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">
                  {candidate.opening.description}
                </p>
              </div>
              <h3 className="font-semibold">Interview feedback</h3>
              {candidate.interviewFeedback.length ? (
                <ul className="space-y-2">
                  {candidate.interviewFeedback.map((item) => (
                    <li key={item.id} className="whitespace-pre-wrap break-words text-sm text-text-secondary">
                      <span className="font-semibold">{item.verdict === "PASSED" ? "Passed" : "Failed"}</span>
                      {" · "}
                      {item.feedback}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary">No interview feedback yet.</p>
              )}
              <h3 className="font-semibold">Latest 100 comments</h3>
              {candidate.comments.length ? (
                <ul className="space-y-2">
                  {candidate.comments.map((item) => (
                    <li key={item.id} className="whitespace-pre-wrap break-words text-sm text-text-secondary">
                      {item.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary">No comments yet.</p>
              )}
              <DhritiTextField label="New comment" value={comment} onChange={setComment} maxLength={5000} />
              <Button
                variant="secondary"
                disabled={busy || !comment.trim()}
                onClick={() => void perform(() => recruitmentService.comment(organizationId, candidate.id, comment))}
              >
                Add comment
              </Button>
            </section>
            <section aria-label="Candidate actions" className="min-w-0 space-y-4">
              {candidate.outcome ? (
                <p className="text-sm text-text-secondary">
                  Outcome:{" "}
                  {candidate.outcome === "JOINED"
                    ? "Joined"
                    : candidate.outcome === "REJECTED"
                      ? "Rejected"
                      : "Offer declined"}
                  {candidate.rejectionReason && <> · Reason: {candidate.rejectionReason}</>}
                </p>
              ) : (
                <>
                  <Button variant="secondary" disabled={busy} onClick={() => onReject(candidate)}>
                    Reject candidate
                  </Button>
                  <label className="block text-sm font-semibold text-text-secondary">
                    Pipeline stage
                    <select
                      className={selectClass}
                      value={stageId}
                      onChange={(event) => setStageId(event.target.value)}
                    >
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    variant="secondary"
                    disabled={busy || candidate.stageId === stageId || candidate.stage.systemKey === "HIRED"}
                    onClick={() => void perform(() => recruitmentService.move(organizationId, candidate, stageId))}
                  >
                    Move candidate
                  </Button>
                  {role === "MANAGER" && (
                    <>
                      <label className="block text-sm font-semibold text-text-secondary">
                        Hiring person
                        <select
                          className={selectClass}
                          value={assigned}
                          onChange={(event) => setAssigned(event.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {assignees.map((person) => (
                            <option key={person.userId} value={person.userId}>
                              {person.user.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button
                        variant="secondary"
                        disabled={busy || (candidate.assignedUserId ?? "") === assigned}
                        onClick={() =>
                          void perform(() => recruitmentService.assign(organizationId, candidate, assigned || null))
                        }
                      >
                        Save hiring person
                      </Button>
                      <DhritiTextField
                        label="Search interviewers"
                        value={interviewerQuery}
                        onChange={(value) => {
                          setInterviewerQuery(value);
                          setInterviewerPage(1);
                        }}
                      />
                      {interviewerError && (
                        <p role="alert" className="text-sm text-error">
                          {interviewerError}
                        </p>
                      )}
                      <label className="block text-sm font-semibold text-text-secondary">
                        Interviewer
                        <select
                          className={selectClass}
                          value={interviewer}
                          onChange={(event) => setInterviewer(event.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {interviewer && !interviewers.some((person) => person.userId === interviewer) && (
                            <option value={interviewer}>Current selection</option>
                          )}
                          {interviewers.slice(0, 50).map((person) => (
                            <option key={person.userId} value={person.userId}>
                              {person.user.name} · {person.user.email}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          disabled={interviewerPage === 1}
                          onClick={() => setInterviewerPage((page) => page - 1)}
                        >
                          Previous interviewers
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={interviewers.length <= 50}
                          onClick={() => setInterviewerPage((page) => page + 1)}
                        >
                          Next interviewers
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy || (candidate.interviewerUserId ?? "") === interviewer}
                          onClick={() =>
                            void perform(() =>
                              recruitmentService.assignInterviewer(organizationId, candidate, interviewer || null),
                            )
                          }
                        >
                          Save interviewer
                        </Button>
                      </div>
                      {candidate.interviewerUserId && (
                        <div className="space-y-2">
                          <p className="break-all text-sm text-text-secondary">
                            Private interview path: {`/${organizationSlug}/interview/${candidate.id}`}
                          </p>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              if (!navigator.clipboard) {
                                setError("Clipboard access is unavailable. Copy the interview path above.");
                                return;
                              }
                              void navigator.clipboard
                                .writeText(`${window.location.origin}/${organizationSlug}/interview/${candidate.id}`)
                                .catch((reason: unknown) => setError(errorMessage(reason)));
                            }}
                          >
                            Copy interview link
                          </Button>
                        </div>
                      )}
                      {candidate.stage.systemKey === "HIRED" && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={busy}
                            onClick={() =>
                              void perform(async () => {
                                await recruitmentService.close(organizationId, candidate, "JOINED");
                                onClose();
                              })
                            }
                          >
                            Mark joined
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              void perform(async () => {
                                await recruitmentService.close(organizationId, candidate, "OFFER_DECLINED");
                                onClose();
                              })
                            }
                          >
                            Offer declined
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </Dialog>
  );
}
