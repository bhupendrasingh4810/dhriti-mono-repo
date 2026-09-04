import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateOrganizationDto {
  @ApiProperty({ example: "Acme Technologies" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "acme", pattern: "^[a-z0-9][a-z0-9-]*$" })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z0-9][a-z0-9-]*$/, {
    message: "Slug must be lowercase letters, numbers and dashes",
  })
  slug!: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: "Acme Technologies" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;
}
