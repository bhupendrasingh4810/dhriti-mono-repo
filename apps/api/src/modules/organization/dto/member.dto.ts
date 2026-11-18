import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";

export class AddMemberDto {
  @ApiProperty({ example: "colleague@acme.com" })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: "Jane Doe", required: false, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

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
