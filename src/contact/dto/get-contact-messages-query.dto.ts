import { ContactPriority, ContactStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetContactMessagesQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'page debe ser un número entero.' })
  @Min(1, { message: 'page debe ser mínimo 1.' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'limit debe ser un número entero.' })
  @Min(1, { message: 'limit debe ser mínimo 1.' })
  @Max(50, { message: 'limit no debe ser mayor a 50.' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'search debe ser texto.' })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isRead debe ser true o false.' })
  isRead?: boolean;

  @IsOptional()
  @IsEnum(ContactStatus, {
    message: 'status debe ser NEW, REVIEWING, CONTACTED o CLOSED.',
  })
  status?: ContactStatus;

  @IsOptional()
  @IsEnum(ContactPriority, {
    message: 'priority debe ser LOW, NORMAL o HIGH.',
  })
  priority?: ContactPriority;
}