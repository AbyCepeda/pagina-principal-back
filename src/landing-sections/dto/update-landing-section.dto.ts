import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class UpdateLandingSectionDto {
  @IsOptional()
  @IsString({ message: 'La etiqueta debe ser texto.' })
  label?: string

  @IsOptional()
  @IsString({ message: 'El enlace debe ser texto.' })
  href?: string

  @IsOptional()
  @IsInt({ message: 'sortOrder debe ser un número entero.' })
  @Min(0, { message: 'sortOrder no puede ser menor a 0.' })
  sortOrder?: number

  @IsOptional()
  @IsBoolean({ message: 'isVisible debe ser verdadero o falso.' })
  isVisible?: boolean
}