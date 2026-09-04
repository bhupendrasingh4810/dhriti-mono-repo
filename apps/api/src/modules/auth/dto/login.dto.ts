import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "jane@acme.com" })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: "Sup3rSecure!" })
  @IsString()
  @MaxLength(128)
  password!: string;
}
