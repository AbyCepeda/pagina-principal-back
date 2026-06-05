import { ContactOptionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class GetContactOptionsQueryDto {
  @IsOptional()
  @IsEnum(ContactOptionType, {
    message: 'El tipo debe ser PROJECT_TYPE o BUDGET.',
  })
  type?: ContactOptionType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive debe ser true o false.' })
  isActive?: boolean;
}