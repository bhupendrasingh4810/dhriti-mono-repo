import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateNoteFolderDto {
  @ApiProperty({ example: "Planning" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

}

export class UpdateNoteFolderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

}

export class DeleteNoteFolderDto {
  @ApiPropertyOptional({ description: "Owned destination folder for this folder's notes" })
  @IsOptional()
  @IsUUID()
  moveToFolderId?: string;

  @ApiPropertyOptional({ description: "Move this folder's notes to Home instead of deleting them" })
  @IsOptional()
  @IsBoolean()
  moveToHome?: boolean;
}

export class NotePermissionDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;
}

export class CreateNoteDto {
  @ApiProperty({ example: "Sprint plan" })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: "Outline the goals for the sprint." })
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  content?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @ApiPropertyOptional({ type: [NotePermissionDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((permission: NotePermissionDto) => permission.userId)
  @ValidateNested({ each: true })
  @Type(() => NotePermissionDto)
  permissions?: NotePermissionDto[];
}

export class UpdateNoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  content?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @ApiPropertyOptional({ type: [NotePermissionDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((permission: NotePermissionDto) => permission.userId)
  @ValidateNested({ each: true })
  @Type(() => NotePermissionDto)
  permissions?: NotePermissionDto[];
}

export class ListNotesQueryDto {
  @ApiPropertyOptional({ description: "List notes in this folder; omit for home notes" })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
