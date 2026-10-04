export type FlowNavView =
  | "dashboard"
  | "my-work"
  | "projects"
  | "issues"
  | "backlog"
  | "boards"
  | "sprints"
  | "roadmap"
  | "reports"
  | "filters";
export type IssueType = "bug" | "story" | "task" | "improvement";
export type IssueStatus = "backlog" | "todo" | "in-progress" | "in-review" | "done" | "blocked";
export type IssuePriority = "highest" | "high" | "medium" | "low" | "lowest";
export type ProjectHealth = "on-track" | "at-risk" | "behind";
export type NavView = FlowNavView;
export type ProjectTab =
  "overview" | "issue-list" | "backlog" | "board" | "sprints" | "roadmap" | "reports" | "settings";
