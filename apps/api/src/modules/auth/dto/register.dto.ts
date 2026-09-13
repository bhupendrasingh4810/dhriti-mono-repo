import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsBoolean, Matches, MaxLength, MinLength, Equals } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "jane@acme.com" })
  @IsEmail({}, { message: "A valid email address is required" })
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: "Jane Doe", minLength: 1, maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: "Sup3rSecure!",
    minLength: 8,
    description: "At least 10 chars with upper, lower, digit and symbol",
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message: "Password must include uppercase, lowercase, number and symbol",
  })
  password!: string;

  @ApiProperty({ 
    example: true,
    description: "Must be true to accept the terms",
  })
  @IsBoolean()
  @Equals(true, { message: "You must accept the terms to register" })
  isTermsAccepted!: boolean;
}
