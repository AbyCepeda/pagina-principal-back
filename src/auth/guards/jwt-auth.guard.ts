import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que valida el JWT enviado en el header:
 *
 * Authorization: Bearer TOKEN
 *
 * Internamente usa la estrategia "jwt" definida en jwt.strategy.ts.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}