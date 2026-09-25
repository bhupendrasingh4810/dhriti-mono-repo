export interface ApiEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CursorPage<T> {
  nextCursor: string | null;
  [key: string]: unknown;
}

export type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELED";
export type IssuePriority = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type RsvpStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE";
