import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length, MaxLength } from "class-validator";

export class CreateAddressDto {
  @ApiPropertyOptional({ example: "Head office" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional({ example: "Acme Technologies Pvt Ltd" })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  recipientName?: string;

  @ApiProperty({ example: "123 Market Street" })
  @IsString()
  @MaxLength(200)
  line1!: string;

  @ApiPropertyOptional({ example: "Suite 10" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @ApiProperty({ example: "Bengaluru" })
  @IsString()
  @MaxLength(120)
  city!: string;

  @ApiPropertyOptional({ example: "Karnataka" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiPropertyOptional({ example: "560001" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @ApiProperty({ example: "IN" })
  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @ApiPropertyOptional({ example: "+91 80 1234 5678" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phoneNumber?: string;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: "Head office" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional({ example: "Acme Technologies Pvt Ltd" })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  recipientName?: string;

  @ApiPropertyOptional({ example: "123 Market Street" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line1?: string;

  @ApiPropertyOptional({ example: "Suite 10" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @ApiPropertyOptional({ example: "Bengaluru" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: "Karnataka" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiPropertyOptional({ example: "560001" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @ApiPropertyOptional({ example: "IN" })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @ApiPropertyOptional({ example: "+91 80 1234 5678" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phoneNumber?: string;
}