export const organizationRoom = (organizationId: string): string => `connect:org:${organizationId}`;

export const channelRoom = (organizationId: string, channelId: string): string =>
  `connect:org:${organizationId}:channel:${channelId}`;

export const userRoom = (organizationId: string, userId: string): string =>
  `connect:org:${organizationId}:user:${userId}`;