import { Injectable } from "@nestjs/common";
import type { AssetType } from "@prisma/client";

import { HrmsOperationsService } from "./hrms-operations.service";

@Injectable()
export class HrmsAssetService {
  constructor(private readonly operations: HrmsOperationsService) {}
  list(organizationId: string) {
    return this.operations.listAssets(organizationId);
  }
  create(
    organizationId: string,
    actorUserId: string,
    input: { name: string; type: AssetType; serialNumber?: string; location?: string; notes?: string },
  ) {
    return this.operations.createAsset(organizationId, actorUserId, input);
  }
  assign(organizationId: string, assetId: string, actorUserId: string, employeeId?: string) {
    return this.operations.assignAsset(organizationId, assetId, actorUserId, employeeId);
  }
}
