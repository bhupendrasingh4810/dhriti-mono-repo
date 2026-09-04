import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { OrganizationRole } from "@prisma/client";

export class CreateInvitationDto {
  @ApiProperty({ example: "newbie@acme.com" })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiPropertyOptional({ enum: OrganizationRole, default: OrganizationRole.MEMBER })
  @IsOptional()
  @IsEnum(OrganizationRole)
  role?: OrganizationRole;
}

export class AcceptInvitationDto {
  @ApiProperty({ description: "Token from the invitation email link" })
  @IsString()
  @MinLength(1)
  token!: string;
}

export class InvitationParamDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  invitationId!: string;
}

export class CreateGroupDto {
  @ApiProperty({ example: "Backend Engineers" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: "Dynamic membership rule; null/omitted = manual group",
    example: { field: "role", op: "in", value: ["OWNER", "ADMIN"] },
  })
  @IsOptional()
  rule?: { field: string; op: "eq" | "in"; value: unknown };
}

export class UpdateGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
