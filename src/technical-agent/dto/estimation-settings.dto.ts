import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class EstimationSettingsDto {
  @ApiPropertyOptional({
    example: 300,
    description:
      'Tarifa por hora en MXN; referencia editable, no tarifa de mercado.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(1)
  @Max(10000)
  hourlyRate?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Horas efectivas disponibles por semana.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(1)
  @Max(80)
  hoursPerWeek?: number;

  @ApiPropertyOptional({ example: 15, default: 15 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100)
  contingencyPercent?: number;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Costos externos únicos en MXN; no incluye mensualidades.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(1000000)
  externalCosts?: number;
}
