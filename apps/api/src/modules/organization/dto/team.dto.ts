import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateTeamDto {
  @ApiProperty({ example: "Engineering" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "engineering" })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z0-9][a-z0-9-]*$/, {
    message: "Slug must be lowercase letters, numbers and dashes",
  })
  slug!: string;

  @ApiPropertyOptional({ example: "Core platform team" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateTeamDto {
  @ApiPropertyOptional({ example: "Engineering" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: "Core platform team" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
