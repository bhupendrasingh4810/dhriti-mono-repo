import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import type { WorkWeekPattern } from "@dhriti/types";

class WorkWeekDateDto {
  @ApiProperty({ format: "date" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  effectiveFrom!: string;
}
export class CreateWorkWeekDto extends WorkWeekDateDto {
  @ApiProperty() @IsString() @Matches(/\S/) @MaxLength(120) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiProperty({ description: "Five rows of seven WORKING, HALF_DAY or OFF values; Monday first" })
  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  pattern!: WorkWeekPattern;
}
export class UpdateWorkWeekDto extends CreateWorkWeekDto {
  @ApiProperty() @IsInt() @Min(1) revision!: number;
}
export class DefaultWorkWeekDto extends WorkWeekDateDto {}
export class AssignWorkWeekDto extends WorkWeekDateDto {
  @ApiProperty({ nullable: true, description: "Null follows the organization default" })
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsUUID()
  ruleId!: string | null;
  @ApiPropertyOptional({ description: "Assign every non-archived employee in this organization at save time" })
  @IsOptional()
  @IsBoolean()
  allEmployees?: boolean;
  @ApiPropertyOptional({ type: [String], description: "Required unless allEmployees is true" })
  @ValidateIf((object: AssignWorkWeekDto) => object.allEmployees !== true || object.employeeIds !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  employeeIds?: string[];
}
export class WorkWeekRangeDto {
  @ApiProperty({ format: "date" }) @Matches(/^\d{4}-\d{2}-\d{2}$/) from!: string;
  @ApiProperty({ format: "date" }) @Matches(/^\d{4}-\d{2}-\d{2}$/) to!: string;
}
export class WorkWeekEmployeeRangeDto extends WorkWeekRangeDto {
  @ApiProperty() @IsUUID() employeeId!: string;
}
