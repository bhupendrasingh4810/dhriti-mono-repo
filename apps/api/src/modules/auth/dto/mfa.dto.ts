import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, MaxLength } from "class-validator";

export class MfaConfirmDto {
  @ApiProperty({ description: "6-digit TOTP from the authenticator app", example: "123456" })
  @IsString()
  @Length(6, 6, { message: "TOTP code must be 6 digits" })
  code!: string;
}

export class MfaDisableDto {
  @ApiProperty()
  @IsString()
  @MaxLength(128)
  password!: string;

  @ApiProperty({ description: "6-digit TOTP from the authenticator app", example: "123456" })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface MfaConfirmResponse {
  enabled: true;
  recoveryCodes: string[];
}
