import { connectChannels } from "./channels";
import { connectConversations } from "./conversations";
import {
  connectAuditLogs,
  connectCalls,
  connectContacts,
  connectFiles,
  connectMeetings,
  connectNotifications,
  connectPinnedItems,
  connectRolePermissions,
  connectSavedMessages,
  connectSearchResults,
  connectSidebarState,
  connectUserSettings,
} from "./enterprise";
import { connectMessages, connectReplies } from "./messages";
import { connectOrganization } from "./organization";
import { connectTeamMembers, connectTeams } from "./teams";
import type { ConnectConversation, ConnectMessage, ConnectUser } from "./types";
import { connectReportsToByUserId, connectUsers } from "./users";
import {
  connectChannelAnalytics,
  connectChannelMemberships,
  connectDraftMessages,
  connectMentionFeed,
  connectPendingInvites,
  connectSidebarCustomSections,
  connectTags,
  connectTeamAnalytics,
} from "./workspaces";

export * from "./types";
export {
  connectAuditLogs,
  connectCalls,
  connectChannels,
  connectChannelAnalytics,
  connectChannelMemberships,
  connectContacts,
  connectConversations,
  connectDraftMessages,
  connectFiles,
  connectMentionFeed,
  connectMeetings,
  connectMessages,
  connectNotifications,
  connectOrganization,
  connectPendingInvites,
  connectPinnedItems,
  connectReplies,
  connectRolePermissions,
  connectReportsToByUserId,
  connectSavedMessages,
  connectSearchResults,
  connectSidebarState,
  connectSidebarCustomSections,
  connectTags,
  connectTeamMembers,
  connectTeamAnalytics,
  connectTeams,
  connectUserSettings,
  connectUsers,
};

export const connectUsersById = connectUsers.reduce<Record<string, ConnectUser>>((acc, user) => {
  acc[user.id] = user;
  return acc;
}, {});

export const connectConversationsById = connectConversations.reduce<Record<string, ConnectConversation>>((acc, conversation) => {
  acc[conversation.id] = conversation;
  return acc;
}, {});

export const connectMessagesByConversation = connectMessages.reduce<Record<string, ConnectMessage[]>>((acc, message) => {
  if (!acc[message.conversationId]) {
    acc[message.conversationId] = [];
  }

  acc[message.conversationId].push(message);
  return acc;
}, {});

export const connectTeamsById = connectTeams.reduce<Record<string, (typeof connectTeams)[number]>>((acc, team) => {
  acc[team.id] = team;
  return acc;
}, {});

export const connectChannelsById = connectChannels.reduce<Record<string, (typeof connectChannels)[number]>>((acc, channel) => {
  acc[channel.id] = channel;
  return acc;
}, {});
