import { IsInt, Min } from 'class-validator';

export class AssignAdminProfileDto {
  @IsInt()
  @Min(1)
  adminProfileId!: number;
}
