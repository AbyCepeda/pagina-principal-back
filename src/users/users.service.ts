import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un usuario nuevo.
   *
   * Valida que no exista otro usuario con el mismo correo
   * y guarda la contraseña encriptada con bcrypt.
   */
  async create(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este correo.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role ?? Role.USER,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Lista todos los usuarios sin exponer contraseñas.
   */
  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'Usuarios obtenidos correctamente',
      data: users,
    };
  }

  /**
   * Busca usuario por email.
   *
   * Este método sí devuelve password porque se usa para login.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  /**
   * Busca usuario por id sin exponer password.
   *
   * Se usa para /auth/me y respuestas públicas internas.
   */
  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }

  /**
   * Busca usuario por id incluyendo password.
   *
   * Se usa solo para procesos internos como cambio de contraseña.
   */
  async findByIdWithPassword(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Actualiza la contraseña de un usuario.
   *
   * Recibe la contraseña ya encriptada.
   */
  async updatePassword(id: number, hashedPassword: string) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Actualiza el rol de un usuario.
   *
   * Evita que el usuario actual se quite su propio rol ADMIN.
   */
  async updateRole(id: number, role: Role, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (user.id === currentUserId && role !== Role.ADMIN) {
      throw new BadRequestException(
        'No puedes quitarte tu propio rol de administrador.',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'Rol actualizado correctamente',
      data: updatedUser,
    };
  }

  /**
   * Activa o desactiva un usuario.
   *
   * Evita que el administrador se desactive a sí mismo.
   */
  async updateStatus(id: number, isActive: boolean, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (user.id === currentUserId) {
      throw new BadRequestException(
        'No puedes desactivar tu propio usuario.',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: isActive
        ? 'Usuario activado correctamente'
        : 'Usuario desactivado correctamente',
      data: updatedUser,
    };
  }

  /**
   * Elimina un usuario.
   *
   * Evita que el usuario autenticado se elimine a sí mismo.
   */
  async remove(id: number, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (user.id === currentUserId) {
      throw new BadRequestException('No puedes eliminar tu propio usuario.');
    }

    const deletedUser = await this.prisma.user.delete({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'Usuario eliminado correctamente',
      data: deletedUser,
    };
  }

  /**
   * Actualiza el perfil del usuario autenticado.
   *
   * Valida que el nuevo correo no esté siendo usado por otro usuario.
   */
  async updateProfile(id: number, name: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const existingUserWithEmail = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUserWithEmail && existingUserWithEmail.id !== id) {
      throw new ConflictException('Ya existe otro usuario con este correo.');
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        name,
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}