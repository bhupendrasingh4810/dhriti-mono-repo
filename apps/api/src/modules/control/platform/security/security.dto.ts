import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsIP,
  IsOptional,
  Max,
  Min,
  IsIn,
  IsString,
  IsISO8601,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";

export class SecurityPageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class BlockIpDto {
  @IsIP()
  ipAddress!: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string;
}

export class SecurityEventsDto extends SecurityPageDto {
  @IsOptional()
  @IsIn(["critical", "high", "medium", "low"])
  severity?: "critical" | "high" | "medium" | "low";

  @IsOptional()
  @IsIn(["open", "resolved"])
  status?: "open" | "resolved";

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;
}

export class SecuritySessionsDto extends SecurityPageDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class RevokeSecuritySessionDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

/** Generic SIEM/WAF adapters must send IDs, not credentials or token contents. */
export class IngestSecurityEventDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/)
  source!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  externalId!: string;

  @IsIn(["critical", "high", "medium", "low"])
  severity!: "critical" | "high" | "medium" | "low";

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;
}
