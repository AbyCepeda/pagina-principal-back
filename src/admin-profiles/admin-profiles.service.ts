import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogAction, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { SaveAdminProfileDto } from './dto/save-admin-profile.dto';
import type { CurrentUser } from '../auth/decorators/current-user.decorator';

const profileWithPermissions = {
  permissions: {
    include: {
      permission: true,
    },
    orderBy: {
      permission: {
        module: 'asc',
      },
    },
  },
  _count: {
    select: {
      users: true,
    },
  },
} satisfies Prisma.AdminProfileInclude;

@Injectable()
export class AdminProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll() {
    const [profiles, permissions] = await Promise.all([
      this.prisma.adminProfile.findMany({
        include: profileWithPermissions,
        orderBy: [{ isSuperAdmin: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      success: true,
      message: 'Perfiles obtenidos correctamente.',
      data: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        description: profile.description,
        isSystem: profile.isSystem,
        isSuperAdmin: profile.isSuperAdmin,
        userCount: profile._count.users,
        permissionKeys: profile.permissions.map((item) => item.permission.key),
      })),
      permissions,
    };
  }

  async create(dto: SaveAdminProfileDto, actor: CurrentUser) {
    const permissionRecords = await this.validatePermissions(
      dto.permissionKeys,
    );
    this.assertPermissionCeiling(dto.permissionKeys, actor);
    const slug = this.toSlug(dto.name);

    try {
      const profile = await this.prisma.adminProfile.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim() || null,
          permissions: {
            create: permissionRecords.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.CREATE,
        module: 'Perfiles',
        description: `Se creó el perfil «${profile.name}».`,
        actorId: actor.id,
        targetId: profile.id,
        targetType: 'AdminProfile',
        metadata: { slug, permissionCount: permissionRecords.length },
      });

      return {
        success: true,
        message: 'Perfil creado correctamente.',
        data: profile,
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Ya existe un perfil con ese nombre.');
      }
      throw error;
    }
  }

  async update(id: number, dto: SaveAdminProfileDto, actor: CurrentUser) {
    const current = await this.prisma.adminProfile.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Perfil no encontrado.');
    if (current.isSystem || current.isSuperAdmin) {
      throw new BadRequestException(
        'El perfil Administrador del sistema está protegido.',
      );
    }

    const permissionRecords = await this.validatePermissions(
      dto.permissionKeys,
    );
    this.assertPermissionCeiling(dto.permissionKeys, actor);
    const slug = this.toSlug(dto.name);

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.adminProfilePermission.deleteMany({
          where: { profileId: id },
        });
        return tx.adminProfile.update({
          where: { id },
          data: {
            name: dto.name.trim(),
            slug,
            description: dto.description?.trim() || null,
            permissions: {
              create: permissionRecords.map((permission) => ({
                permissionId: permission.id,
              })),
            },
          },
        });
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.UPDATE,
        module: 'Perfiles',
        description: `Se actualizó el perfil «${updated.name}».`,
        actorId: actor.id,
        targetId: updated.id,
        targetType: 'AdminProfile',
        metadata: { slug, permissionCount: permissionRecords.length },
      });

      return {
        success: true,
        message: 'Perfil actualizado correctamente.',
        data: updated,
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Ya existe un perfil con ese nombre.');
      }
      throw error;
    }
  }

  async remove(id: number, actor: CurrentUser) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado.');
    if (profile.isSystem || profile.isSuperAdmin) {
      throw new BadRequestException(
        'No se puede eliminar un perfil protegido del sistema.',
      );
    }
    if (profile._count.users > 0) {
      throw new BadRequestException(
        'Reasigna primero a los usuarios de este perfil.',
      );
    }

    await this.prisma.adminProfile.delete({ where: { id } });
    await this.auditLogService.createLog({
      action: AuditLogAction.DELETE,
      module: 'Perfiles',
      description: `Se eliminó el perfil «${profile.name}».`,
      actorId: actor.id,
      targetId: profile.id,
      targetType: 'AdminProfile',
      metadata: { slug: profile.slug },
    });

    return {
      success: true,
      message: 'Perfil eliminado correctamente.',
      data: profile,
    };
  }

  private async validatePermissions(keys: string[]) {
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
    });
    if (permissions.length !== new Set(keys).size) {
      throw new BadRequestException(
        'La lista contiene permisos no reconocidos.',
      );
    }
    return permissions;
  }

  private toSlug(name: string) {
    return name
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private assertPermissionCeiling(permissionKeys: string[], actor: CurrentUser) {
    if (actor.isSuperAdmin) return;
    const actorPermissions = new Set(actor.permissions ?? []);
    if (permissionKeys.some((key) => !actorPermissions.has(key))) {
      throw new BadRequestException(
        'No puedes asignar permisos que tu propio perfil no tiene.',
      );
    }
  }
}
