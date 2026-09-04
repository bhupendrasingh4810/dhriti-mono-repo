import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateSpaceDto {
  @ApiProperty({ example: "ENG" })
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z][A-Z0-9]*$/, { message: "Key must be uppercase letters/numbers" })
  key!: string;

  @ApiProperty({ example: "Engineering Handbook" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: "📘" })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  icon?: string;
}

export class UpdateSpaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  icon?: string;
}
