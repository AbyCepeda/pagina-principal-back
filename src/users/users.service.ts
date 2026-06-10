import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca un usuario por correo.
   *
   * Se usa en login, por eso incluye password.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });
  }

  /**
   * Busca un usuario por ID sin exponer password.
   */
  async findById(id: number) {
    return this.prisma.user.findUnique({
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
  }

  /**
   * Busca un usuario por ID incluyendo password.
   *
   * Se usa para cambiar contraseña.
   */
  async findByIdWithPassword(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Crea un usuario nuevo.
   *
   * Encripta la contraseña antes de guardar.
   */
  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
  }) {
    try {
      const email = data.email.trim().toLowerCase();

      const existingUser = await this.findByEmail(email);

      if (existingUser) {
        throw new ConflictException('El correo ya está registrado.');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await this.prisma.user.create({
        data: {
          name: data.name.trim(),
          email,
          password: hashedPassword,
          role: data.role ?? Role.USER,
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
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      console.error('Error al crear usuario:', error);

      throw new InternalServerErrorException('No se pudo crear el usuario.');
    }
  }

  /**
   * Lista usuarios con paginación, búsqueda y filtros.
   *
   * Permite buscar por nombre/correo, filtrar por rol,
   * filtrar por estado y cargar registros por página.
   */
  async findAll(query: GetUsersQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;

      const search = query.search?.trim();

      const where: Prisma.UserWhereInput = {
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                  },
                },
                {
                  email: {
                    contains: search,
                  },
                },
              ],
            }
          : {}),

        ...(query.role ? { role: query.role } : {}),

        ...(typeof query.isActive === 'boolean'
          ? { isActive: query.isActive }
          : {}),
      };

      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        this.prisma.user.count({
          where,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Usuarios obtenidos correctamente',
        data: users,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error al obtener usuarios:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los usuarios.',
      );
    }
  }

  /**
   * Actualiza el rol de un usuario.
   */
  async updateRole(id: number, role: Role, currentUserId: number) {
    try {
      if (id === currentUserId) {
        throw new BadRequestException(
          'No puedes cambiar tu propio rol desde esta pantalla.',
        );
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Error al actualizar rol:', error);

      throw new InternalServerErrorException('No se pudo actualizar el rol.');
    }
  }

  /**
   * Activa o desactiva un usuario.
   */
  async updateStatus(id: number, isActive: boolean, currentUserId: number) {
    try {
      if (id === currentUserId) {
        throw new BadRequestException(
          'No puedes desactivar tu propio usuario.',
        );
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Error al actualizar estado:', error);

      throw new InternalServerErrorException(
        'No se pudo actualizar el estado del usuario.',
      );
    }
  }

  /**
   * Actualiza solo la contraseña del usuario.
   */
  async updatePassword(id: number, hashedPassword: string) {
    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
  }

  /**
   * Actualiza nombre y correo del perfil.
   */
  async updateProfile(id: number, name: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: {
          id,
        },
      },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya está registrado.');
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        name: name.trim(),
        email: normalizedEmail,
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

  /**
   * Elimina un usuario.
   */
  async remove(id: number, currentUserId: number) {
    try {
      if (id === currentUserId) {
        throw new BadRequestException(
          'No puedes eliminar tu propio usuario.',
        );
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Error al eliminar usuario:', error);

      throw new InternalServerErrorException(
        'No se pudo eliminar el usuario.',
      );
    }
  }
}