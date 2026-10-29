import { Type } from "class-transformer";
import {
  ArrayUnique,
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
  ValidateIf,
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

  @ApiPropertyOptional({ default: false })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isOwner?: boolean;
}

export class CreateNoteDto {
  @ApiPropertyOptional({ default: false })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isPublic?: boolean;

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
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isPublic?: boolean;

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
  @ApiPropertyOptional({ description: "List notes in this folder; omit for all accessible notes" })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}

export class UpdateNoteOrderDto {
  @ApiPropertyOptional({ description: "Folder-specific order; omit for All notes" })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiProperty({ type: [String], description: "Visible note IDs in the requested order (up to 10000)" })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(10000)
  @IsUUID("all", { each: true })
  noteIds!: string[];
}

export class CreateNoteAccessRequestDto {
  @ApiProperty({ enum: ["EDIT", "OWNER"] })
  @IsIn(["EDIT", "OWNER"])
  requestedRole!: "EDIT" | "OWNER";
}

export class ReviewNoteAccessRequestDto {
  @ApiProperty({ enum: ["APPROVED", "REJECTED"] })
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @ApiPropertyOptional({ enum: ["EDIT", "OWNER"], description: "Defaults to the requested role" })
  @IsOptional()
  @IsIn(["EDIT", "OWNER"])
  grantedRole?: "EDIT" | "OWNER";
}
