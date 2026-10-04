import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { EnabledProduct } from "@prisma/client";

class OrganizationProfileDto {
  @ApiPropertyOptional({ example: "billing@acme.example" })
  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @ApiPropertyOptional({ enum: EnabledProduct, isArray: true, example: ["FLOW", "CONNECT"] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(EnabledProduct, { each: true })
  enabledProducts?: EnabledProduct[];

  @ApiPropertyOptional({ example: "Acme's workspace" })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ example: "Internal account notes" })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats?: number;
}

export class CreateOrganizationDto extends OrganizationProfileDto {
  @ApiProperty({ example: "Acme Technologies" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "acme", pattern: "^[a-z0-9][a-z0-9-]*$" })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z0-9][a-z0-9-]*$/, {
    message: "Slug must be lowercase letters, numbers and dashes",
  })
  slug!: string;
}

export class UpdateOrganizationDto extends OrganizationProfileDto {
  @ApiPropertyOptional({ example: "Acme Technologies" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;
}

export class UpdateOrganizationBillingDto {
  @ApiPropertyOptional({ example: "Acme Technologies Pvt Ltd" })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  billingLegalEntityName?: string;

  @ApiPropertyOptional({ example: "29ABCDE1234F1Z5" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  billingGstin?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsString()
  billingAddressId?: string | null;

  @ApiPropertyOptional({ type: [String], example: ["accounts@acme.example"] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  invoiceContactEmails?: string[];

  @ApiPropertyOptional({ example: { stripeCustomerId: "cus_123" } })
  @IsOptional()
  @IsObject()
  paymentProviderIds?: Record<string, string>;
}
