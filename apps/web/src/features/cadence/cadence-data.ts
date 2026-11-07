export type CadenceCard = {
  id: number;
  column: ColumnName;
  text: string;
  author: string;
  votes: number;
  comments: number;
  tag?: "Most voted" | "Anonymous";
};

export type ColumnName = "Went well" | "To improve" | "Ideas" | "Kudos";

export const phases = ["Lobby", "Reflect", "Group", "Vote", "Discuss", "Actions", "Summary"];

export const columns: Array<{
  name: ColumnName;
  subtitle: string;
  tone: "success" | "warning" | "info" | "brand";
}> = [
  { name: "Went well", subtitle: "Wins to celebrate", tone: "success" },
  { name: "To improve", subtitle: "Friction we noticed", tone: "warning" },
  { name: "Ideas", subtitle: "Experiments to try", tone: "info" },
  { name: "Kudos", subtitle: "People to appreciate", tone: "brand" },
];

export const initialCards: CadenceCard[] = [
  { id: 1, column: "Went well", text: "The new release checklist made Thursday’s deployment feel calm and predictable.", author: "Anika", votes: 4, comments: 2, tag: "Most voted" },
  { id: 2, column: "Went well", text: "Design and engineering pairing helped us catch edge cases before QA.", author: "Maya", votes: 2, comments: 1 },
  { id: 3, column: "Went well", text: "Kudos to Jay for jumping on the billing incident so quickly.", author: "Sam", votes: 1, comments: 0 },
  { id: 4, column: "To improve", text: "Too many mid-sprint priority changes made the goal harder to protect.", author: "Anonymous", votes: 3, comments: 4, tag: "Anonymous" },
  { id: 5, column: "To improve", text: "PR reviews are still waiting more than a day during busy periods.", author: "Jay", votes: 1, comments: 3 },
  { id: 6, column: "Ideas", text: "Add a 15-minute async risk check before sprint planning.", author: "Anonymous", votes: 2, comments: 2, tag: "Anonymous" },
  { id: 7, column: "Ideas", text: "Create a rotating reviewer role to keep pull requests moving.", author: "Maya", votes: 1, comments: 0 },
  { id: 8, column: "Kudos", text: "The platform team’s observability workshop was immediately useful.", author: "Anika", votes: 2, comments: 1 },
];

export const initialActions = [
  { id: 1, text: "Update API docs before the sprint ends", owner: "Alex Chen", done: true },
  { id: 2, text: "Schedule 1:1 with new engineering hire", owner: "Emily Park", done: false },
  { id: 3, text: "Create issue for mobile nav regression", owner: "Mark Johnson", done: false },
  { id: 4, text: "Share retro summary to #general", owner: "Sarah Kim", done: true },
];
