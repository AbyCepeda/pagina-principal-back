import { Controller, Get } from '@nestjs/common';
import { LandingService } from './landing.service';

@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  /**
   * Ruta pública.
   *
   * Devuelve en una sola petición los datos necesarios para la landing:
   * servicios, proyectos y opciones del formulario de contacto.
   */
  @Get()
  findPublicLandingData() {
    return this.landingService.findPublicLandingData();
  }
}