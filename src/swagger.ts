import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API de cotización y gestión de software')
    .setDescription(
      'API REST del portafolio: cotizaciones, solicitudes, usuarios y administración de contenido. ' +
        'Para probar rutas privadas, inicia sesión en POST /auth/login y pega data.accessToken en Authorize. ' +
        'Las rutas administrativas requieren rol ADMIN.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication) {
  SwaggerModule.setup('docs', app, createApiDocument(app), {
    jsonDocumentUrl: 'docs-json',
    customSiteTitle: 'Documentación de la API',
    swaggerOptions: { persistAuthorization: false, tagsSorter: 'alpha' },
  });
}
