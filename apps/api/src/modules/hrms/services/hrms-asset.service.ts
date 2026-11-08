import { Injectable } from "@nestjs/common";
import type { AssetCondition, AssetStatus, AssetType } from "@prisma/client";

import { HrmsOperationsService } from "./hrms-operations.service";

@Injectable()
export class HrmsAssetService {
  constructor(private readonly operations: HrmsOperationsService) {}
  list(organizationId: string, query: Parameters<HrmsOperationsService["listAssets"]>[1]) {
    return this.operations.listAssets(organizationId, query);
  }
  create(
    organizationId: string,
    actorUserId: string,
    input: { name: string; type: AssetType; serialNumber: string; customCategory?: string; condition?: AssetCondition; status?: AssetStatus; assignedEmployeeId?: string; location?: string; notes?: string },
  ) {
    return this.operations.createAsset(organizationId, actorUserId, input);
  }
  assign(organizationId: string, assetId: string, actorUserId: string, employeeId?: string) {
    return this.operations.assignAsset(organizationId, assetId, actorUserId, employeeId);
  }
  update(organizationId: string, assetId: string, actorUserId: string, input: Parameters<HrmsOperationsService["updateAsset"]>[3]) {
    return this.operations.updateAsset(organizationId, assetId, actorUserId, input);
  }
  remove(organizationId: string, assetId: string, actorUserId: string) {
    return this.operations.deleteAsset(organizationId, assetId, actorUserId);
  }
}
