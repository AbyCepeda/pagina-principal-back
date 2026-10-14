import { ApiTags } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { Controller, Get } from '@nestjs/common';

@ApiTags('Estado')
@Controller('health')
export class HealthController {
  @ApiEndpoint({
    summary: 'Consultar el estado del backend',
    access: 'public',
    status: 200,
  })
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      message: 'Backend funcionando correctamente',
      timestamp: new Date().toISOString(),
    };
  }
}
