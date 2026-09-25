import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";

export interface SessionInput {
  type: string;
  title: string;
  teamId?: string;
  isAnonymous?: boolean;
}
const base = "/api/organization/cadence";
export const cadenceService = {
  listSessions: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/sessions`),
  createSession: (organizationId: string, input: SessionInput) =>
    tenantJsonRequest<ApiEntity, SessionInput>(organizationId, `${base}/sessions`, "POST", input),
  getSession: (organizationId: string, sessionId: string) =>
    tenantRequest<ApiEntity>(organizationId, `${base}/sessions/${pathSegment(sessionId)}`),
  setPhase: (organizationId: string, sessionId: string, phase: string) =>
    tenantJsonRequest<ApiEntity, { phase: string }>(
      organizationId,
      `${base}/sessions/${pathSegment(sessionId)}/phase`,
      "PATCH",
      { phase },
    ),
  addCard: (organizationId: string, sessionId: string, input: { content: string; column: string }) =>
    tenantJsonRequest<ApiEntity, { content: string; column: string }>(
      organizationId,
      `${base}/sessions/${pathSegment(sessionId)}/cards`,
      "POST",
      input,
    ),
  groupCard: (
    organizationId: string,
    sessionId: string,
    cardId: string,
    input: { groupId?: string | null; position?: number },
  ) =>
    tenantJsonRequest<ApiEntity, { groupId?: string | null; position?: number }>(
      organizationId,
      `${base}/sessions/${pathSegment(sessionId)}/cards/${pathSegment(cardId)}/group`,
      "PATCH",
      input,
    ),
  deleteCard: (organizationId: string, sessionId: string, cardId: string) =>
    tenantRequest<void>(organizationId, `${base}/sessions/${pathSegment(sessionId)}/cards/${pathSegment(cardId)}`, {
      method: "DELETE",
    }),
  vote: (organizationId: string, sessionId: string, cardId: string) =>
    tenantJsonRequest<void, { cardId: string }>(
      organizationId,
      `${base}/sessions/${pathSegment(sessionId)}/votes`,
      "POST",
      { cardId },
    ),
  unvote: (organizationId: string, sessionId: string, cardId: string) =>
    tenantRequest<void>(organizationId, `${base}/sessions/${pathSegment(sessionId)}/votes/${pathSegment(cardId)}`, {
      method: "DELETE",
    }),
};
