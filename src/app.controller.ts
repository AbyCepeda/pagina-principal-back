import { ApiTags } from '@nestjs/swagger';
import { ApiEndpoint } from './common/decorators/api-endpoint.decorator';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@ApiTags('Inicio')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiEndpoint({
    summary: 'Comprobar la respuesta raíz de la API',
    access: 'public',
    status: 200,
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
