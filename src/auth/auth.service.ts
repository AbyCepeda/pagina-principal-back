import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra un usuario nuevo.
   *
   * La contraseña se encripta dentro de UsersService.
   */
  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    return {
      success: true,
      message: 'Usuario registrado correctamente',
      data: user,
    };
  }

  /**
   * Inicia sesión.
   *
   * Busca el usuario por correo, valida que esté activo,
   * valida la contraseña con bcrypt y genera un JWT.
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Tu usuario está desactivado. Contacta al administrador.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      success: true,
      message: 'Inicio de sesión correcto',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
    };
  }

  /**
   * Obtiene el usuario autenticado desde base de datos.
   *
   * Esto permite validar que el usuario todavía exista
   * y que siga activo aunque el token sea válido.
   */
  async me(userId: number) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Tu usuario está desactivado. Contacta al administrador.',
      );
    }

    return {
      success: true,
      message: 'Usuario autenticado',
      data: user,
    };
  }

  /**
   * Cambia la contraseña del usuario autenticado.
   *
   * 1. Busca el usuario incluyendo password.
   * 2. Valida que la contraseña actual sea correcta.
   * 3. Valida que la nueva contraseña no sea igual a la actual.
   * 4. Encripta la nueva contraseña.
   * 5. Guarda el nuevo hash.
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Tu usuario está desactivado. Contacta al administrador.',
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual no es correcta.');
    }

    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'La nueva contraseña no puede ser igual a la contraseña actual.',
      );
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    await this.usersService.updatePassword(userId, hashedNewPassword);

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
      data: null,
    };
  }

  /**
   * Actualiza el perfil del usuario autenticado.
   *
   * Permite cambiar nombre y correo.
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Tu usuario está desactivado. Contacta al administrador.',
      );
    }

    const updatedUser = await this.usersService.updateProfile(
      userId,
      updateProfileDto.name.trim(),
      updateProfileDto.email.trim().toLowerCase(),
    );

    return {
      success: true,
      message: 'Perfil actualizado correctamente',
      data: updatedUser,
    };
  }
}
