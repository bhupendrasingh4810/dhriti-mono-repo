import { IsBoolean, IsString, IsUrl, Length, Matches, MaxLength, MinLength } from "class-validator";

export class ConfigureOidcDto {
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  issuer!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  clientId!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  clientSecret!: string;
  @IsBoolean()
  enabled!: boolean;
}

export class StartOidcDto {
  @IsString()
  @Length(1, 120)
  @Matches(/^[a-zA-Z0-9-]+$/)
  organizationSlug!: string;
}

export class FinishOidcDto {
  @IsUrl({ require_tld: false })
  @MaxLength(8192)
  callbackUrl!: string;
  @IsString()
  @Length(43, 43)
  @Matches(/^[A-Za-z0-9_-]+$/)
  binding!: string;
}
