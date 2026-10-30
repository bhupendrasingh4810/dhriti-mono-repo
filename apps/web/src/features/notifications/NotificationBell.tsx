"use client";

import { useAuth } from "@/hooks/use-auth";
import { NotificationInbox } from "./NotificationInbox";

export function NotificationBell() {
  const { user } = useAuth();
  return user?.organization ? (
    <NotificationInbox
      key={`${user.id}:${user.organization.id}`}
      organizationId={user.organization.id}
      organizationSlug={user.organization.slug ?? user.organization.id}
    />
  ) : null;
}
