import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";
import { LegalDocumentType } from "@prisma/client";

export class CreateLegalDocumentDto {
  @ApiProperty({ enum: LegalDocumentType })
  @IsEnum(LegalDocumentType)
  type!: LegalDocumentType;

  @ApiProperty({ example: "1.0.0" })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  version!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  content!: string;
}

export class UpdateLegalDocumentDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  content?: string;
}
