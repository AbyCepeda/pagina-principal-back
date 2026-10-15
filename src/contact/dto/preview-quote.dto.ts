import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  ArrayUnique,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class PreviewQuoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  quotePlanSlug!: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @ApiPropertyOptional({ type: [String], example: ['reports'] })
  quoteExtraIds?: string[];
}
