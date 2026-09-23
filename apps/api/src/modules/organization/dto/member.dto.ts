import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsUUID, MaxLength } from "class-validator";
import { UserRole } from "@prisma/client";

export class InviteMemberDto {
  @ApiProperty({ example: "colleague@acme.com" })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ enum: UserRole, default: UserRole.EMPLOYEE })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateMemberLifecycleDto {
  @ApiProperty({ enum: ["ACTIVE", "SUSPENDED"] })
  @IsEnum(["ACTIVE", "SUSPENDED"])
  status!: "ACTIVE" | "SUSPENDED";
}

export class TransferOwnershipDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  memberId!: string;
}

export class MemberParamDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  memberId!: string;
}
