import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

type EndpointOptions = {
  summary: string;
  access?: 'public' | 'authenticated' | 'admin';
  status?: number;
};

export function ApiEndpoint({
  summary,
  access = 'public',
  status = 200,
}: EndpointOptions) {
  const decorators = [
    ApiOperation({
      summary,
      description:
        access === 'admin'
          ? 'Requiere un usuario activo con rol ADMIN.'
          : access === 'authenticated'
            ? 'Requiere un usuario activo autenticado con JWT.'
            : 'Endpoint público; no requiere autenticación.',
    }),
    ApiResponse({ status, description: 'Operación completada correctamente.' }),
    ApiBadRequestResponse({
      description: 'Los datos enviados no son válidos.',
    }),
    ApiResponse({
      status: 429,
      description: 'Se excedió el límite de peticiones.',
    }),
  ];

  if (access !== 'public') {
    decorators.push(
      ApiBearerAuth('access-token'),
      ApiUnauthorizedResponse({
        description:
          'Token inválido o expirado, o usuario inactivo o eliminado.',
      }),
      ApiForbiddenResponse({
        description: 'No tienes permiso para esta operación.',
      }),
    );
  }

  return applyDecorators(...decorators);
}
