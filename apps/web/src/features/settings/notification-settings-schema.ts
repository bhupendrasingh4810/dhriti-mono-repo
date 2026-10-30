import type { NotificationPreference, NotificationType } from "@dhriti/types";

type NotificationEvent = {
  type: NotificationType;
  label: string;
  description: string;
  automaticDelivery: boolean;
};

export type NotificationSettingsGroup = {
  id: string;
  title: string;
  events: NotificationEvent[];
};

export const NOTIFICATION_SETTINGS_GROUPS: NotificationSettingsGroup[] = [
  {
    id: "connect",
    title: "Connect",
    events: [
      {
        type: "DIRECT_MESSAGE",
        label: "Direct messages",
        description: "New messages in direct and group chats.",
        automaticDelivery: true,
      },
      {
        type: "MENTION",
        label: "Mentions",
        description: "When someone @mentions you in Connect.",
        automaticDelivery: true,
      },
      { type: "CALL", label: "Missed calls", description: "Calls you did not answer.", automaticDelivery: true },
      {
        type: "MESSAGE",
        label: "Other messages",
        description: "Other message notifications submitted through the notification API.",
        automaticDelivery: false,
      },
    ],
  },
  {
    id: "notes",
    title: "Notes",
    events: [
      {
        type: "NOTES_SHARED",
        label: "Notes shared with you",
        description: "Access to a note is shared with you.",
        automaticDelivery: true,
      },
      {
        type: "NOTES_ACCESS_REQUEST",
        label: "Access requests",
        description: "Someone requests edit or co-owner access to your note.",
        automaticDelivery: true,
      },
      {
        type: "NOTES_ACCESS_DECISION",
        label: "Request decisions",
        description: "Your note access request is approved or rejected.",
        automaticDelivery: true,
      },
    ],
  },
  {
    id: "pulse",
    title: "Pulse",
    events: [
      {
        type: "PULSE_INVITATION",
        label: "Event invitations",
        description: "You are invited to an event or meeting.",
        automaticDelivery: true,
      },
      {
        type: "PULSE_EVENT_UPDATE",
        label: "Event changes",
        description: "An event is rescheduled, updated or cancelled.",
        automaticDelivery: true,
      },
      {
        type: "MEETING_REMINDER",
        label: "Meeting reminders",
        description: "Reminders before Pulse events.",
        automaticDelivery: false,
      },
    ],
  },
  {
    id: "flow",
    title: "Flow",
    events: [
      {
        type: "FLOW_ASSIGNMENT",
        label: "Issue assignments",
        description: "An issue is assigned to you.",
        automaticDelivery: true,
      },
      {
        type: "FLOW_COMMENT",
        label: "Issue comments",
        description: "Comments and replies on your issues.",
        automaticDelivery: false,
      },
      {
        type: "FLOW_DUE_DATE",
        label: "Issue due dates",
        description: "Upcoming or overdue issues.",
        automaticDelivery: false,
      },
    ],
  },
  {
    id: "atlas",
    title: "Atlas",
    events: [
      {
        type: "ATLAS_SHARED",
        label: "Shared knowledge",
        description: "A page or space is shared with you.",
        automaticDelivery: false,
      },
      {
        type: "ATLAS_COMMENT",
        label: "Page comments",
        description: "Comments and replies on pages.",
        automaticDelivery: true,
      },
      {
        type: "ATLAS_MENTION",
        label: "Page mentions",
        description: "You are mentioned in a page or comment.",
        automaticDelivery: false,
      },
    ],
  },
  {
    id: "cadence",
    title: "Cadence",
    events: [
      {
        type: "CADENCE_INVITATION",
        label: "Session invitations",
        description: "A retrospective session is created for your team.",
        automaticDelivery: true,
      },
      {
        type: "CADENCE_REMINDER",
        label: "Session reminders",
        description: "Reminders to participate in a session.",
        automaticDelivery: false,
      },
      {
        type: "CADENCE_RESULTS",
        label: "Session results",
        description: "Session results and action items are available.",
        automaticDelivery: true,
      },
    ],
  },
  {
    id: "hrms",
    title: "HRMS",
    events: [
      {
        type: "HRMS_LEAVE_REQUEST",
        label: "Leave requests",
        description: "Organization owners receive new leave requests for review.",
        automaticDelivery: true,
      },
      {
        type: "HRMS_LEAVE_DECISION",
        label: "Leave decisions",
        description: "Your leave request is approved or rejected.",
        automaticDelivery: true,
      },
      {
        type: "HRMS_PAYROLL",
        label: "Payroll updates",
        description: "Payroll or payslip updates for your account.",
        automaticDelivery: true,
      },
    ],
  },
  {
    id: "control",
    title: "Control",
    events: [
      {
        type: "CONTROL_MEMBERSHIP",
        label: "Membership changes",
        description: "Your organization membership becomes active.",
        automaticDelivery: true,
      },
      {
        type: "CONTROL_ROLE_CHANGE",
        label: "Role changes",
        description: "Your organization role changes.",
        automaticDelivery: true,
      },
      {
        type: "CONTROL_SETTINGS_CHANGE",
        label: "Settings changes",
        description: "Organization owners receive app settings change alerts.",
        automaticDelivery: true,
      },
    ],
  },
  {
    id: "other",
    title: "Other activity",
    events: [
      {
        type: "COMMENT",
        label: "General comments",
        description: "Comments not classified under a specific app.",
        automaticDelivery: false,
      },
      {
        type: "ASSIGNMENT",
        label: "General assignments",
        description: "Assignments not classified under a specific app.",
        automaticDelivery: false,
      },
      {
        type: "DUE_DATE",
        label: "General due dates",
        description: "Due-date notifications not classified under a specific app.",
        automaticDelivery: false,
      },
      {
        type: "SYSTEM",
        label: "System updates",
        description: "General account and organization notifications.",
        automaticDelivery: false,
      },
    ],
  },
];

export const defaultNotificationPreference = (type: NotificationType): NotificationPreference => ({
  type,
  inApp: true,
  email: type !== "CALL",
  push: false,
});
