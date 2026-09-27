import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { SubscriptionPlan, SubscriptionStatus, SupportTicketPriority, SupportTicketStatus } from "@prisma/client";

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
