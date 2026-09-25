import { pathSegment, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
const base = "/api/organization/files";
export const filesService = {
  upload: (organizationId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return tenantRequest<ApiEntity>(organizationId, base, { method: "POST", body });
  },
  list: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, base),
  download: (organizationId: string, fileId: string) =>
    tenantRequest<{ url: string; expiresIn: number }>(organizationId, `${base}/${pathSegment(fileId)}/download`),
  delete: (organizationId: string, fileId: string) =>
    tenantRequest<void>(organizationId, `${base}/${pathSegment(fileId)}`, { method: "DELETE" }),
};
