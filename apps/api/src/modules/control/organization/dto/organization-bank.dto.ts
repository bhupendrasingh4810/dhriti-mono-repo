import { IsIn, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateOrganizationBankDto {
  @IsString() @Matches(/\S/) @MaxLength(100) label!: string;
  @IsString() @Matches(/\S/) @MaxLength(160) accountHolder!: string;
  @IsString() @Matches(/\S/) @MaxLength(160) bankName!: string;
  @Matches(/^[A-Z]{2}$/) countryCode!: string;
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsIn(["IBAN", "LOCAL"]) accountType!: "IBAN" | "LOCAL";
  @IsString() @MinLength(4) @MaxLength(64) accountNumber!: string;
  @IsString() @MaxLength(64) routingCode!: string;
  @IsString() @MaxLength(11) swiftCode!: string;
}

export class ReviewOrganizationBankDto {
  @IsIn(["ACCEPT", "REJECT"]) decision!: "ACCEPT" | "REJECT";
  @IsString() @Matches(/\S/) @MinLength(3) @MaxLength(500) evidenceReference!: string;
  @IsString() @Matches(/\S/) @MinLength(3) @MaxLength(1000) note!: string;
}
