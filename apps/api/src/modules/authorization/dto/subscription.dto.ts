import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateSubscriptionDto {
  @ApiProperty({ example: "pro" }) @IsString() planKey!: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 100000 }) @IsOptional() @IsInt() @Min(1) @Max(100000) seatCount?: number;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: "pro" }) @IsOptional() @IsString() planKey?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 100000 }) @IsOptional() @IsInt() @Min(1) @Max(100000) seatCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() cancelAtPeriodEnd?: boolean;
}
