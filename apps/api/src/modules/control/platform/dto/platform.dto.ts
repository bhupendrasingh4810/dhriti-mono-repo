import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { EntitlementKind, SubscriptionPlan, SubscriptionStatus, SupportTicketPriority, SupportTicketStatus } from "@prisma/client";

export class CreatePlatformOrganizationDto {
  @ApiProperty({ example: "Acme Technologies" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "admin@acme.example" })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ enum: SubscriptionPlan, default: "FREE" })
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;

  @ApiProperty({ minimum: 1, maximum: 100000 })
  @IsInt()
  @Min(1)
  @Max(100000)
  seats!: number;
}

export class ListPlatformOrganizationsQueryDto {
  @ApiPropertyOptional({ description: "Searches organization names" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: SubscriptionPlan })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: ["name", "seats", "createdAt"], default: "createdAt" })
  @IsOptional()
  @IsIn(["name", "seats", "createdAt"])
  sortBy?: "name" | "seats" | "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: "connect" })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  key!: string;

  @ApiProperty({ example: "Connect" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: "Monthly price in cents" })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceMonthly?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priceMonthly?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionPlan })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  seats?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;
}

export class UpdateEntitlementDto {
  @ApiProperty({ description: "Product key, e.g. connect | flow | atlas | pulse | nexus | cadence" })
  @IsString()
  @MinLength(1)
  productKey!: string;

  @ApiProperty()
  @IsBoolean()
  isEnabled!: boolean;
}

export class ListEntitlementsQueryDto {
  @ApiPropertyOptional({ description: "Searches entitlement names and keys" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ description: "Filters by product key" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  productKey?: string;

  @ApiPropertyOptional({ enum: EntitlementKind })
  @IsOptional()
  @IsEnum(EntitlementKind)
  kind?: EntitlementKind;

  @ApiPropertyOptional({ enum: ["key", "name", "productKey", "kind"], default: "key" })
  @IsOptional()
  @IsIn(["key", "name", "productKey", "kind"])
  sortBy?: "key" | "name" | "productKey" | "kind";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "asc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpsertFeatureFlagDto {
  @ApiProperty({ example: "ai-summaries" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  key!: string;

  @ApiProperty()
  @IsBoolean()
  isEnabled!: boolean;
}

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body!: string;

  @ApiPropertyOptional({ enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ description: "Internal staff note" })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  notes?: string;
}

export class CreatePlatformRoleDto {
  @ApiProperty({ example: "operations" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  key!: string;

  @ApiProperty({ example: "Operations" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class PlanEntitlementDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  entitlementKey!: string;

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({ description: "Required non-negative limit for LIMIT entitlements" })
  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number;
}

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ type: [PlanEntitlementDto] })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  entitlements?: PlanEntitlementDto[];
}

export class UpdatePlanEntitlementsDto {
  @ApiProperty({ type: [PlanEntitlementDto] })
  @IsArray()
  @IsObject({ each: true })
  entitlements!: PlanEntitlementDto[];
}

export class UpdatePlanStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

export class CreateEntitlementDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: EntitlementKind })
  @IsEnum(EntitlementKind)
  kind!: EntitlementKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  productKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  unit?: string;
}

export class UpdateEntitlementDefinitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: EntitlementKind })
  @IsOptional()
  @IsEnum(EntitlementKind)
  kind?: EntitlementKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  productKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  unit?: string;
}
