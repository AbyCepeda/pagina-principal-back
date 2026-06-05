import { PartialType } from '@nestjs/mapped-types';
import { CreateContactOptionDto } from './create-contact-option.dto';

export class UpdateContactOptionDto extends PartialType(CreateContactOptionDto) {}