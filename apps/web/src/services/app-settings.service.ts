import type {
  AppSettingsKey,
  AppSettingsMap,
  AppSettingsUpdateMap,
  ConnectUserSettings,
  SettingsAccess,
} from "@dhriti/types";
import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
export { appSettingsPatch } from "@/features/settings/app-settings-policies";

export type {
  AppSettingsKey,
  AppSettingsMap,
  AppSettingsUpdateMap,
  AtlasOrganizationSettings,
  CadenceOrganizationSettings,
  ConnectManualStatus,
  ConnectOrganizationSettings,
  ConnectUserSettings,
  FlowOrganizationSettings,
  HrmsOrganizationSettings,
  NexusOrganizationSettings,
  NotesOrganizationSettings,
  NotificationPreference,
  NotificationType,
  PulseOrganizationSettings,
  SettingsAccess,
} from "@dhriti/types";

const base = "/api/organization/settings/apps";

export const appSettingsService = {
  get: <K extends AppSettingsKey>(organizationId: string, app: K) =>
    tenantRequest<AppSettingsMap[K]>(organizationId, `${base}/${pathSegment(app)}`),
  getAccess: (organizationId: string) => tenantRequest<SettingsAccess>(organizationId, `${base}/access`),
  update: <K extends AppSettingsKey>(organizationId: string, app: K, changes: Partial<AppSettingsUpdateMap[K]>) =>
    tenantJsonRequest<AppSettingsMap[K], Partial<AppSettingsUpdateMap[K]>>(
      organizationId,
      `${base}/${pathSegment(app)}`,
      "PATCH",
      changes,
    ),
  getConnectUser: (organizationId: string) => tenantRequest<ConnectUserSettings>(organizationId, `${base}/connect/me`),
  updateConnectUser: (organizationId: string, changes: Partial<ConnectUserSettings>) =>
    tenantJsonRequest<ConnectUserSettings, Partial<ConnectUserSettings>>(
      organizationId,
      `${base}/connect/me`,
      "PATCH",
      changes,
    ),
};
