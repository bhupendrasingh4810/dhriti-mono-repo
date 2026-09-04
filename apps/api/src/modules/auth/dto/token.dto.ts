import { ApiProperty } from "@nestjs/swagger";
import { IsJWT, IsString, MaxLength } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({ description: "Opaque refresh token returned at login" })
  @IsString()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: "Token from the verification email link" })
  @IsString()
  @MaxLength(256)
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: "jane@acme.com" })
  @IsString()
  @MaxLength(320)
  email!: string;
}

export class MfaVerifyLoginDto {
  @ApiProperty({ description: "Short-lived MFA challenge token returned by login" })
  @IsJWT()
  mfaToken!: string;

  @ApiProperty({ description: "6-digit TOTP code", example: "123456" })
  @IsString()
  code!: string;
}

export class MfaRecoveryLoginDto {
  @ApiProperty({ description: "Short-lived MFA challenge token returned by login" })
  @IsJWT()
  mfaToken!: string;

  @ApiProperty({ description: "One-time recovery code", example: "ab12-cd34-ef56" })
  @IsString()
  @MaxLength(64)
  recoveryCode!: string;
}
