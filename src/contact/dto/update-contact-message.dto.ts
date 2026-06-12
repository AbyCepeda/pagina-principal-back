import { ContactPriority, ContactStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContactMessageDto {
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

  @IsOptional()
  @IsString({ message: 'adminNotes debe ser texto.' })
  @MaxLength(2000, {
    message: 'adminNotes no debe superar los 2000 caracteres.',
  })
  adminNotes?: string;
}