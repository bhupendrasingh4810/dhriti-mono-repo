import { tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
export interface ExtractedTask {
  title: string;
  assignee?: string;
  dueDate?: string;
  priority?: string;
  [key: string]: unknown;
}
const base = "/api/organization/nexus";
export const nexusService = {
  summarizeConversation: (organizationId: string, input: { channelId: string; messageLimit?: number }) =>
    tenantJsonRequest<ApiEntity, typeof input>(organizationId, `${base}/summarize/conversation`, "POST", input),
  summarizePage: (organizationId: string, input: { pageId: string }) =>
    tenantJsonRequest<ApiEntity, typeof input>(organizationId, `${base}/summarize/page`, "POST", input),
  extractTasks: (organizationId: string, text: string) =>
    tenantJsonRequest<ExtractedTask[], { text: string }>(organizationId, `${base}/extract-tasks`, "POST", { text }),
  ask: (organizationId: string, input: { question: string; conversationId?: string }) =>
    tenantJsonRequest<{ conversationId: string; answer: string }, typeof input>(
      organizationId,
      `${base}/ask`,
      "POST",
      input,
    ),
  listConversations: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/conversations`),
  listTasks: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/tasks`),
};
