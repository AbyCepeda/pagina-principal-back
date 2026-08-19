import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactCommentDto {
  @IsString({ message: 'El comentario debe ser texto.' })
  @IsNotEmpty({ message: 'El comentario es obligatorio.' })
  @MinLength(2, {
    message: 'El comentario debe tener al menos 2 caracteres.',
  })
  @MaxLength(2000, {
    message: 'El comentario no debe superar los 2000 caracteres.',
  })
  message!: string;
}