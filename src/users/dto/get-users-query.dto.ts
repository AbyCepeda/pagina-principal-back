import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetProjectsQueryDto {
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
}