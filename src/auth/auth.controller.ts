import {
  ApiTags,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registro público de usuarios.
   *
   * Crea una cuenta USER pendiente de activación.
   * El usuario no podrá iniciar sesión hasta que un ADMIN lo active.
   */
  @ApiEndpoint({
    summary: 'Registrar una cuenta pendiente de activación',
    access: 'public',
    status: 201,
  })
  @ApiConflictResponse({ description: 'El correo ya está registrado.' })
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000, blockDuration: 60000 } })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Login público.
   *
   * Aquí todavía no existe token, por eso no lleva guards.
   */
  @ApiEndpoint({
    summary: 'Iniciar sesión y obtener un JWT',
    access: 'public',
    status: 201,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales incorrectas o cuenta inactiva.',
  })
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000, blockDuration: 60000 } })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Validar sesión actual.
   *
   * Requiere token JWT.
   */
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint({
    summary: 'Consultar el usuario autenticado',
    access: 'authenticated',
    status: 200,
  })
  @Get('me')
  me(@CurrentUser() user: CurrentUserType) {
    return this.authService.me(user.id);
  }

  /**
   * Cambiar contraseña del usuario autenticado.
   *
   * Requiere token JWT.
   */
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint({
    summary: 'Cambiar la contraseña propia',
    access: 'authenticated',
    status: 200,
  })
  @Patch('change-password')
  @Throttle({ default: { limit: 10, ttl: 60000, blockDuration: 60000 } })
  changePassword(
    @CurrentUser() user: CurrentUserType,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  /**
   * Actualizar perfil del usuario autenticado.
   *
   * Requiere token JWT.
   */
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint({
    summary: 'Actualizar el perfil propio',
    access: 'authenticated',
    status: 200,
  })
  @ApiConflictResponse({ description: 'El correo ya está registrado.' })
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }
}
