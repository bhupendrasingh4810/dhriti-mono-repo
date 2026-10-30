import type { NotificationOutbox, NotificationType, Prisma } from "@prisma/client";

export type NotificationEnvelope = Pick<
  NotificationOutbox,
  "id" | "organizationId" | "recipientId" | "actorId" | "sourceType" | "sourceId" | "type" | "payload"
>;

export interface NotificationEvent {
  organizationId: string;
  actorId?: string;
  sourceType: string;
  sourceId?: string;
  type: NotificationType;
  recipientIds: string[];
  title: string;
  body?: string;
  /** Organization-relative app path, never an externally supplied URL. */
  path?: string;
  dedupKey?: string;
  emailByDefault?: boolean;
  suppressEmail?: boolean;
}

/** Call inside the same transaction as the business mutation. */
export async function enqueueNotification(tx: Prisma.TransactionClient, event: NotificationEvent): Promise<void> {
  const recipients = [...new Set(event.recipientIds)].filter((id) => id !== event.actorId);
  if (!recipients.length) {
    return;
  }
  await tx.notificationOutbox.createMany({
    data: recipients.map((recipientId) => ({
      organizationId: event.organizationId,
      recipientId,
      actorId: event.actorId,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      type: event.type,
      payload: {
        version: 1,
        title: event.title,
        body: event.body ?? "",
        path: event.path ?? event.sourceType,
        ...(event.emailByDefault !== undefined ? { emailByDefault: event.emailByDefault } : {}),
        ...(event.suppressEmail !== undefined ? { suppressEmail: event.suppressEmail } : {}),
      },
      dedupKey: event.dedupKey ? `${event.organizationId}:${event.dedupKey}:${recipientId}` : undefined,
    })),
    skipDuplicates: true,
  });
}
