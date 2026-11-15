"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { recruitmentService, type InterviewDetails } from "@/services/hrms-recruitment.service";
import { Button, Card } from "./components/ui-primitives";

const errorMessage = (reason: unknown) =>
  reason instanceof Error ? reason.message : "Unable to load or submit interview feedback.";

export function InterviewFeedbackPage({ candidateId }: { candidateId: string }) {
  const { user, loading } = useAuth();
  const organizationId = user?.organization?.id;
  const [result, setResult] = useState<{ key: string; candidate: InterviewDetails } | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [verdict, setVerdict] = useState<"" | "PASSED" | "FAILED">("");
  const [validation, setValidation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const key = `${user?.id ?? ""}:${organizationId ?? ""}:${candidateId}`;
  const candidate = result?.key === key && organizationId && user?.id ? result.candidate : null;

  useEffect(() => {
    if (!organizationId || !user?.id) return;
    let active = true;
    recruitmentService
      .interview(organizationId, candidateId)
      .then((data) => {
        if (active) {
          setResult({ key, candidate: data });
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setResult(null);
          setError(errorMessage(reason));
        }
      });
    return () => {
      active = false;
    };
  }, [organizationId, candidateId, key, refresh, user?.id]);

  const submit = async () => {
    if (!organizationId || !candidate) return;
    if (!verdict || !feedback.trim()) {
      setValidation(true);
      return;
    }
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await recruitmentService.submitInterviewFeedback(organizationId, candidate, verdict, feedback);
      setFeedback("");
      setVerdict("");
      setValidation(false);
      setSaved(true);
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header>
        <h1 className="text-xl font-bold text-text-primary">Interview feedback</h1>
        <p className="text-sm text-text-secondary">Only the assigned interviewer can access this page.</p>
      </header>
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      {!organizationId && !loading && (
        <p role="alert" className="text-error">
          Select an organization to access this interview.
        </p>
      )}
      {!candidate && !error && (loading || organizationId) && <p role="status">Loading interview…</p>}
      {candidate && (
        <Card className="space-y-4 p-4">
          <div>
            <h2 className="font-semibold">{candidate.name}</h2>
            <p className="text-sm text-text-secondary">
              {candidate.opening.title} · {candidate.stage.name}
            </p>
            <p className="text-sm text-text-secondary">
              {candidate.email}
              {candidate.phone ? ` · ${candidate.phone}` : ""}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Job description</h3>
            <p className="whitespace-pre-wrap text-sm text-text-secondary">{candidate.opening.description}</p>
          </div>
          <div>
            <h3 className="font-semibold">Comments</h3>
            {candidate.comments.length ? (
              candidate.comments.map((item) => (
                <p key={item.id} className="whitespace-pre-wrap text-sm text-text-secondary">
                  {item.text}
                </p>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No comments yet.</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold">Previous interview feedback</h3>
            {candidate.interviewFeedback.length ? (
              candidate.interviewFeedback.map((item) => (
                <p key={item.id} className="whitespace-pre-wrap text-sm text-text-secondary">
                  {item.verdict === "PASSED" ? "Passed" : "Failed"} · {item.feedback}
                </p>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No feedback yet.</p>
            )}
          </div>
          <label className="block text-sm font-semibold">
            Interview result <span className="text-error">*</span>
            <select
              className={`mt-1 w-full cursor-pointer rounded-md border bg-surface px-3 py-2 ${validation && !verdict ? "border-error" : "border-border"}`}
              value={verdict}
              aria-invalid={validation && !verdict}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "" || value === "PASSED" || value === "FAILED") setVerdict(value);
              }}
            >
              <option value="">Select a result</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
            </select>
          </label>
          {validation && !verdict && (
            <p role="alert" className="text-sm text-error">
              Select a result.
            </p>
          )}
          <label className="block text-sm font-semibold">
            Feedback <span className="text-error">*</span>
            <textarea
              className={`mt-1 w-full rounded-md border bg-surface px-3 py-2 ${validation && !feedback.trim() ? "border-error" : "border-border"}`}
              value={feedback}
              maxLength={5000}
              rows={5}
              aria-invalid={validation && !feedback.trim()}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </label>
          {validation && !feedback.trim() && (
            <p role="alert" className="text-sm text-error">
              Feedback is required.
            </p>
          )}
          {saved && (
            <p role="status" className="text-text-secondary">
              Feedback submitted.
            </p>
          )}
          <Button disabled={busy} onClick={() => void submit()}>
            Submit feedback
          </Button>
        </Card>
      )}
    </main>
  );
}
