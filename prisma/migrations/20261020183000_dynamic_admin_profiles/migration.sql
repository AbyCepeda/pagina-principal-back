-- Perfiles administrativos configurables y permisos por módulo/acción.
-- Role (ADMIN/USER) se conserva para distinguir personal de clientes y
-- mantener intacto el flujo actual mientras se migra la autorización.

CREATE TABLE "AdminProfile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminProfilePermission" (
    "profileId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    CONSTRAINT "AdminProfilePermission_pkey" PRIMARY KEY ("profileId", "permissionId")
);

ALTER TABLE "User" ADD COLUMN "adminProfileId" INTEGER;

CREATE UNIQUE INDEX "AdminProfile_name_key" ON "AdminProfile"("name");
CREATE UNIQUE INDEX "AdminProfile_slug_key" ON "AdminProfile"("slug");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE INDEX "AdminProfilePermission_permissionId_idx" ON "AdminProfilePermission"("permissionId");
CREATE INDEX "User_adminProfileId_idx" ON "User"("adminProfileId");

ALTER TABLE "AdminProfilePermission"
    ADD CONSTRAINT "AdminProfilePermission_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "AdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminProfilePermission"
    ADD CONSTRAINT "AdminProfilePermission_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User"
    ADD CONSTRAINT "User_adminProfileId_fkey"
    FOREIGN KEY ("adminProfileId") REFERENCES "AdminProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "AdminProfile" ("name", "slug", "description", "isSystem", "isSuperAdmin", "updatedAt")
VALUES ('Administrador', 'administrador', 'Acceso completo a todos los módulos y permisos.', true, true, CURRENT_TIMESTAMP);

INSERT INTO "Permission" ("key", "name", "module", "description") VALUES
    ('profiles:manage', 'Gestionar perfiles', 'Perfiles', 'Crear perfiles y administrar sus permisos.'),
    ('dashboard:read', 'Ver dashboard', 'Dashboard', 'Consultar el resumen administrativo.'),
    ('technical-agent:use', 'Usar agente técnico', 'Agente técnico', 'Generar análisis técnicos.'),
    ('security:read', 'Ver seguridad', 'Seguridad', 'Consultar el estado de seguridad.'),
    ('activity:read', 'Ver historial', 'Historial', 'Consultar el historial de actividad.'),
    ('schedules:manage', 'Gestionar cronogramas', 'Cronogramas', 'Crear y modificar cronogramas.'),
    ('messages:read', 'Ver mensajes', 'Mensajes', 'Consultar solicitudes y conversaciones.'),
    ('messages:reply', 'Responder mensajes', 'Mensajes', 'Responder en conversaciones.'),
    ('messages:update', 'Actualizar seguimiento', 'Mensajes', 'Actualizar estado, prioridad y notas.'),
    ('messages:delete', 'Eliminar mensajes', 'Mensajes', 'Eliminar solicitudes de contacto.'),
    ('messages:analyze', 'Analizar solicitudes', 'Mensajes', 'Generar análisis técnico de solicitudes.'),
    ('users:read', 'Ver usuarios', 'Usuarios', 'Consultar cuentas de usuario.'),
    ('users:create', 'Crear usuarios', 'Usuarios', 'Crear cuentas.'),
    ('users:update', 'Actualizar usuarios', 'Usuarios', 'Editar o activar y desactivar cuentas.'),
    ('users:delete', 'Eliminar usuarios', 'Usuarios', 'Eliminar cuentas.'),
    ('users:assign-profile', 'Asignar perfiles', 'Usuarios', 'Asignar perfiles administrativos a cuentas.'),
    ('projects:read', 'Ver proyectos', 'Proyectos', 'Consultar proyectos.'),
    ('projects:create', 'Crear proyectos', 'Proyectos', 'Crear proyectos.'),
    ('projects:update', 'Editar proyectos', 'Proyectos', 'Modificar proyectos.'),
    ('projects:delete', 'Eliminar proyectos', 'Proyectos', 'Eliminar proyectos.'),
    ('services:read', 'Ver servicios', 'Servicios', 'Consultar servicios.'),
    ('services:create', 'Crear servicios', 'Servicios', 'Crear servicios.'),
    ('services:update', 'Editar servicios', 'Servicios', 'Modificar servicios.'),
    ('services:delete', 'Eliminar servicios', 'Servicios', 'Eliminar servicios.'),
    ('plans:read', 'Ver paquetes', 'Paquetes', 'Consultar paquetes.'),
    ('plans:create', 'Crear paquetes', 'Paquetes', 'Crear paquetes.'),
    ('plans:update', 'Editar paquetes', 'Paquetes', 'Modificar paquetes.'),
    ('plans:delete', 'Eliminar paquetes', 'Paquetes', 'Eliminar paquetes.'),
    ('landing-sections:read', 'Ver secciones landing', 'Landing', 'Consultar configuración de secciones.'),
    ('landing-sections:update', 'Editar secciones landing', 'Landing', 'Modificar visibilidad y orden de secciones.'),
    ('contact-options:read', 'Ver opciones de contacto', 'Landing', 'Consultar opciones del formulario.'),
    ('contact-options:create', 'Crear opciones de contacto', 'Landing', 'Crear opciones del formulario.'),
    ('contact-options:update', 'Editar opciones de contacto', 'Landing', 'Modificar opciones del formulario.'),
    ('contact-options:delete', 'Eliminar opciones de contacto', 'Landing', 'Eliminar opciones del formulario.'),
    ('account:read', 'Ver cuenta propia', 'Cuenta', 'Consultar el perfil propio.'),
    ('account:update', 'Editar cuenta propia', 'Cuenta', 'Modificar el perfil propio.'),
    ('appearance:manage', 'Cambiar apariencia', 'Apariencia', 'Modificar apariencia del sitio.');

-- Vincula a los administradores existentes con el perfil de acceso completo.
UPDATE "User"
SET "adminProfileId" = (
    SELECT "id" FROM "AdminProfile" WHERE "slug" = 'administrador'
)
WHERE "role" = 'ADMIN';

-- El perfil propietario conserva toda la matriz para que pueda verse y editarse.
INSERT INTO "AdminProfilePermission" ("profileId", "permissionId")
SELECT profile."id", permission."id"
FROM "AdminProfile" AS profile
CROSS JOIN "Permission" AS permission
WHERE profile."slug" = 'administrador';

-- USER sigue siendo cuenta de cliente y no recibe perfil administrativo.
