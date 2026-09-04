import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsUUID, MaxLength } from "class-validator";
import { OrganizationRole } from "@prisma/client";

export class InviteMemberDto {
  @ApiProperty({ example: "colleague@acme.com" })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ enum: OrganizationRole, default: OrganizationRole.MEMBER })
  @IsEnum(OrganizationRole)
  role!: OrganizationRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: OrganizationRole })
  @IsEnum(OrganizationRole)
  role!: OrganizationRole;
}

export class MemberParamDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  memberId!: string;
}
