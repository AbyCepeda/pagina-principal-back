import { ApiTags } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { Controller, Get } from '@nestjs/common';
import { LandingService } from './landing.service';

@ApiTags('Landing pública')
@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  /**
   * Ruta pública.
   *
   * Devuelve en una sola petición los datos necesarios para la landing:
   * servicios, proyectos y opciones del formulario de contacto.
   */
  @ApiEndpoint({
    summary: 'Consultar los datos públicos de la landing',
    access: 'public',
    status: 200,
  })
  @Get()
  findPublicLandingData() {
    return this.landingService.findPublicLandingData();
  }
}
