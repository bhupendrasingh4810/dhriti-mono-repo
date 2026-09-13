import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsJWT, IsString, Matches, MaxLength } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({ description: "Opaque refresh token returned at login" })
  @IsString()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: "jane@acme.com" })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ description: "Verification token returned after registration", maxLength: 256 })
  @IsString()
  @MaxLength(256)
  token!: string;

  @ApiProperty({ description: "6-digit code from the verification email", example: "123456" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "OTP must be exactly 6 digits" })
  otp!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: "jane@acme.com" })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ description: "Verification token returned after registration", maxLength: 256 })
  @IsString()
  @MaxLength(256)
  token!: string;
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
