import { PartialType } from '@nestjs/swagger';
import { CreateContactOptionDto } from './create-contact-option.dto';

export class UpdateContactOptionDto extends PartialType(
  CreateContactOptionDto,
) {}
