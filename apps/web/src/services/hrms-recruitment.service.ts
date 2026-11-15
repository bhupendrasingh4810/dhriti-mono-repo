import { tenantJsonRequest, tenantRequest } from "./request.service";

export type RecruitmentRole = "MANAGER" | "INTERVIEWER";
export type RecruitmentAccess = { admin: boolean; role: RecruitmentRole | null };
export type RecruitmentMember = { userId: string; user: { name: string; email: string } };
export type RecruitmentGrant = RecruitmentMember & { role: RecruitmentRole };
export type JobOpeningInput = {
  title: string;
  department: string;
  location: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  workMode: "ONSITE" | "HYBRID" | "REMOTE";
  description: string;
  companyName?: string | null;
  experienceMin?: number | null;
  experienceMax?: number | null;
  ctcMin?: string | null;
  ctcMax?: string | null;
  ctcCurrency?: string | null;
  ctcPeriod?: "YEAR" | "MONTH" | null;
  ctcNotDisclosed?: boolean;
  postedDate?: string | null;
  openingsCount?: number | null;
  highlights?: string | null;
  keySkills?: string[];
};
export type JobOpening = JobOpeningInput & { id: string; status: "DRAFT" | "OPEN" | "CLOSED"; revision: number };
export type JobOpeningListItem = JobOpening & { _count: { candidates: number } };
export type JobOpeningPage = {
  items: JobOpeningListItem[];
  total: number;
  open: number;
  applied: number;
  interviews: number;
  hired: number;
};
export type RecruitmentStage = { id: string; name: string; position: number; systemKey: string | null };
export type RecruitmentCandidate = {
  id: string;
  openingId: string;
  stageId: string;
  name: string;
  email: string;
  phone: string | null;
  assignedUserId: string | null;
  interviewerUserId: string | null;
  outcome: "JOINED" | "OFFER_DECLINED" | "REJECTED" | null;
  rejectionReason: string | null;
  revision: number;
  opening: { title: string };
  stage: RecruitmentStage;
  interviewFeedback: InterviewFeedback[];
};
export type CandidateDetails = RecruitmentCandidate & {
  opening: { title: string; description: string };
  comments: { id: string; text: string; authorUserId: string; createdAt: string }[];
};
export type InterviewFeedback = {
  id: string;
  authorUserId: string;
  verdict: "PASSED" | "FAILED";
  feedback: string;
  createdAt: string;
};
export type InterviewDetails = CandidateDetails & { opening: JobOpening };
export type CandidateInput = { openingId: string; name: string; email: string; phone?: string };
export type RecruitmentAssignee = { userId: string; role: RecruitmentRole; user: { name: string } };

const base = "/api/organization/hrms/recruitment";
export const recruitmentService = {
  stages: (org: string) => tenantRequest<RecruitmentStage[]>(org, `${base}/stages`),
  addStage: (org: string, name: string) =>
    tenantJsonRequest<RecruitmentStage, { name: string }>(org, `${base}/stages`, "POST", { name }),
  renameStage: (org: string, id: string, name: string) =>
    tenantJsonRequest<RecruitmentStage, { name: string }>(org, `${base}/stages/${encodeURIComponent(id)}`, "PATCH", {
      name,
    }),
  deleteStage: (org: string, id: string) =>
    tenantRequest<unknown>(org, `${base}/stages/${encodeURIComponent(id)}`, { method: "DELETE" }),
  reorderStages: (org: string, stageIds: string[], expectedStageIds: string[]) =>
    tenantJsonRequest<unknown, { stageIds: string[]; expectedStageIds: string[] }>(
      org,
      `${base}/stages/order`,
      "PATCH",
      { stageIds, expectedStageIds },
    ),
  board: (org: string, openingId?: string, includeClosed = false) =>
    tenantRequest<RecruitmentCandidate[]>(org, `${base}/board`, {
      query: { openingId, includeClosed: String(includeClosed) },
    }),
  reject: (org: string, candidate: RecruitmentCandidate, reason: string) =>
    tenantJsonRequest<unknown, { reason: string; revision: number }>(
      org,
      `${base}/candidates/${encodeURIComponent(candidate.id)}/rejection`,
      "PATCH",
      { reason, revision: candidate.revision },
    ),
  candidates: (org: string, page: number, openingId?: string, scope: "active" | "closed" = "active") =>
    tenantRequest<{ items: RecruitmentCandidate[]; total: number }>(org, `${base}/candidates`, {
      query: { page, openingId, scope },
    }),
  candidate: (org: string, id: string) =>
    tenantRequest<CandidateDetails>(org, `${base}/candidates/${encodeURIComponent(id)}`),
  createCandidate: (org: string, input: CandidateInput) =>
    tenantJsonRequest<RecruitmentCandidate, CandidateInput>(org, `${base}/candidates`, "POST", input),
  move: (org: string, candidate: RecruitmentCandidate, stageId: string) =>
    tenantJsonRequest<unknown, { stageId: string; revision: number }>(
      org,
      `${base}/candidates/${encodeURIComponent(candidate.id)}/stage`,
      "PATCH",
      { stageId, revision: candidate.revision },
    ),
  assign: (org: string, candidate: RecruitmentCandidate, userId: string | null) =>
    tenantJsonRequest<unknown, { userId: string | null; revision: number }>(
      org,
      `${base}/candidates/${encodeURIComponent(candidate.id)}/assignment`,
      "PATCH",
      { userId, revision: candidate.revision },
    ),
  assignInterviewer: (org: string, candidate: RecruitmentCandidate, userId: string | null) =>
    tenantJsonRequest<unknown, { userId: string | null; revision: number }>(
      org,
      `${base}/candidates/${encodeURIComponent(candidate.id)}/interviewer`,
      "PATCH",
      { userId, revision: candidate.revision },
    ),
  interview: (org: string, id: string) =>
    tenantRequest<InterviewDetails>(org, `${base}/interviews/${encodeURIComponent(id)}`),
  submitInterviewFeedback: (org: string, candidate: InterviewDetails, verdict: "PASSED" | "FAILED", feedback: string) =>
    tenantJsonRequest<unknown, { verdict: "PASSED" | "FAILED"; feedback: string; revision: number }>(
      org,
      `${base}/interviews/${encodeURIComponent(candidate.id)}/feedback`,
      "POST",
      { verdict, feedback, revision: candidate.revision },
    ),
  interviewers: (org: string, query: string, page: number) =>
    tenantRequest<RecruitmentMember[]>(org, `${base}/interviewers`, { query: { query, page } }),
  close: (org: string, candidate: RecruitmentCandidate, outcome: "JOINED" | "OFFER_DECLINED") =>
    tenantJsonRequest<unknown, { outcome: "JOINED" | "OFFER_DECLINED"; revision: number }>(
      org,
      `${base}/candidates/${encodeURIComponent(candidate.id)}/outcome`,
      "PATCH",
      { outcome, revision: candidate.revision },
    ),
  comment: (org: string, candidateId: string, text: string) =>
    tenantJsonRequest<unknown, { text: string }>(
      org,
      `${base}/candidates/${encodeURIComponent(candidateId)}/comments`,
      "POST",
      { text },
    ),
  assignees: (org: string) => tenantRequest<RecruitmentAssignee[]>(org, `${base}/assignees`),
  access: (org: string) => tenantRequest<RecruitmentAccess>(org, `${base}/access`),
  members: (org: string, query: string, page: number) =>
    tenantRequest<RecruitmentMember[]>(org, `${base}/members`, { query: { query, page } }),
  grants: (org: string) => tenantRequest<RecruitmentGrant[]>(org, `${base}/grants`),
  grant: (org: string, userId: string, role: RecruitmentRole) =>
    tenantJsonRequest<unknown, { userId: string; role: RecruitmentRole }>(org, `${base}/grants`, "POST", {
      userId,
      role,
    }),
  revoke: (org: string, userId: string) =>
    tenantRequest<unknown>(org, `${base}/grants/${encodeURIComponent(userId)}`, { method: "DELETE" }),
  openings: (org: string, page: number) => tenantRequest<JobOpeningPage>(org, `${base}/openings`, { query: { page } }),
  create: (org: string, input: JobOpeningInput) =>
    tenantJsonRequest<JobOpening, JobOpeningInput>(org, `${base}/openings`, "POST", input),
  status: (org: string, opening: JobOpening, status: JobOpening["status"]) =>
    tenantJsonRequest<JobOpening, { status: JobOpening["status"]; revision: number }>(
      org,
      `${base}/openings/${encodeURIComponent(opening.id)}/status`,
      "PATCH",
      { status, revision: opening.revision },
    ),
};
