import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";

export interface SpaceInput {
  key?: string;
  name?: string;
  description?: string;
  icon?: string;
}
export interface PageInput {
  title?: string;
  parentId?: string | null;
  content?: string;
  position?: number;
  isPublished?: boolean;
}
const base = "/api/organization/atlas";
export const atlasService = {
  listSpaces: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/spaces`),
  createSpace: (organizationId: string, input: Required<Pick<SpaceInput, "key" | "name">> & SpaceInput) =>
    tenantJsonRequest<ApiEntity, SpaceInput>(organizationId, `${base}/spaces`, "POST", input),
  updateSpace: (organizationId: string, spaceId: string, input: SpaceInput) =>
    tenantJsonRequest<ApiEntity, SpaceInput>(organizationId, `${base}/spaces/${pathSegment(spaceId)}`, "PATCH", input),
  deleteSpace: (organizationId: string, spaceId: string) =>
    tenantRequest<void>(organizationId, `${base}/spaces/${pathSegment(spaceId)}`, { method: "DELETE" }),
  listPages: (organizationId: string, spaceId: string) =>
    tenantRequest<ApiEntity[]>(organizationId, `${base}/spaces/${pathSegment(spaceId)}/pages`),
  createPage: (organizationId: string, spaceId: string, input: Required<Pick<PageInput, "title">> & PageInput) =>
    tenantJsonRequest<ApiEntity, PageInput>(
      organizationId,
      `${base}/spaces/${pathSegment(spaceId)}/pages`,
      "POST",
      input,
    ),
  getPage: (organizationId: string, pageId: string) =>
    tenantRequest<ApiEntity>(organizationId, `${base}/pages/${pathSegment(pageId)}`),
  updatePage: (organizationId: string, pageId: string, input: PageInput) =>
    tenantJsonRequest<ApiEntity, PageInput>(organizationId, `${base}/pages/${pathSegment(pageId)}`, "PATCH", input),
  deletePage: (organizationId: string, pageId: string) =>
    tenantRequest<void>(organizationId, `${base}/pages/${pathSegment(pageId)}`, { method: "DELETE" }),
  listComments: (organizationId: string, pageId: string) =>
    tenantRequest<ApiEntity[]>(organizationId, `${base}/pages/${pathSegment(pageId)}/comments`),
  addComment: (organizationId: string, pageId: string, input: { content: string }) =>
    tenantJsonRequest<ApiEntity, { content: string }>(
      organizationId,
      `${base}/pages/${pathSegment(pageId)}/comments`,
      "POST",
      input,
    ),
  resolveComment: (organizationId: string, commentId: string, isResolved: boolean) =>
    tenantJsonRequest<ApiEntity, { isResolved: boolean }>(
      organizationId,
      `${base}/comments/${pathSegment(commentId)}/resolve`,
      "PATCH",
      { isResolved },
    ),
  deleteComment: (organizationId: string, commentId: string) =>
    tenantRequest<void>(organizationId, `${base}/comments/${pathSegment(commentId)}`, { method: "DELETE" }),
};
