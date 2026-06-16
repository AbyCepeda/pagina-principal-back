# Página Principal Back

Backend desarrollado con **NestJS**, **Prisma** y **MySQL/MariaDB** para una landing profesional con panel administrativo, autenticación, gestión de contenido y seguimiento de mensajes de contacto.

Este proyecto forma parte de un portafolio profesional y también funciona como base reutilizable para crear páginas web o sistemas administrativos para clientes.

## Tecnologías utilizadas

* NestJS
* TypeScript
* Prisma ORM
* MySQL / MariaDB
* JWT Authentication
* Passport JWT
* Bcrypt
* Class Validator
* Class Transformer

## Funcionalidades principales

* Autenticación con JWT.
* Registro e inicio de sesión.
* Roles de usuario: `ADMIN` y `USER`.
* Panel administrativo protegido.
* Gestión de usuarios.
* Gestión de proyectos.
* Gestión de servicios.
* Gestión de opciones de contacto.
* Formulario público de contacto.
* Seguimiento administrativo de mensajes tipo mini CRM:

  * Estado del mensaje.
  * Prioridad.
  * Notas internas.
  * Fecha de contacto.
* Dashboard administrativo con métricas.
* Endpoint público optimizado para landing:

  * Servicios.
  * Proyectos.
  * Tipos de proyecto.
  * Opciones de presupuesto.
* Cache temporal para reducir consultas a la base de datos.

## Estructura general

```txt
src/
  auth/
  users/
  contact/
  contact-options/
  projects/
  services/
  dashboard/
  landing/
  prisma/
```

## Requisitos

Antes de ejecutar el proyecto necesitas tener instalado:

* Node.js
* npm
* MySQL o MariaDB
* Docker, opcional pero recomendado para la base de datos

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`.

Ejemplo:

```env
DATABASE_URL="mysql://root:password@127.0.0.1:3308/pagina_principal_db"

DATABASE_HOST=""
DATABASE_PORT=""
DATABASE_USER=""
DATABASE_PASSWORD=""
DATABASE_NAME=""

JWT_SECRET="change_this_secret"
```

> Importante: el archivo `.env` no debe subirse al repositorio.

## Base de datos

Ejecutar migraciones de Prisma:

```bash
npx prisma migrate dev
```

Generar cliente de Prisma:

```bash
npx prisma generate
```

Ejecutar seed de datos iniciales:

```bash
npm run seed
```

## Ejecutar en desarrollo

```bash
npm run start:dev
```

Por defecto, el backend se ejecuta en:

```txt
http://localhost:4000
```

## Compilar proyecto

```bash
npm run build
```

## Ejecutar en producción

```bash
npm run start:prod
```

## Scripts disponibles

```bash
npm run start
npm run start:dev
npm run start:debug
npm run start:prod
npm run build
npm run lint
npm run format
npm run seed
npm run test
```

## Endpoints principales

### Auth

```txt
POST /auth/register
POST /auth/login
GET /auth/me
PATCH /auth/change-password
PATCH /auth/profile
```

### Usuarios

```txt
GET /users
PATCH /users/:id/role
PATCH /users/:id/status
DELETE /users/:id
```

### Contacto

```txt
POST /contact
GET /contact
GET /contact/unread/count
GET /contact/:id
PATCH /contact/:id
PATCH /contact/:id/read
DELETE /contact/:id
```

### Proyectos

```txt
GET /projects
POST /projects
GET /projects/:id
PATCH /projects/:id
DELETE /projects/:id
```

### Servicios

```txt
GET /services
POST /services
GET /services/:id
PATCH /services/:id
DELETE /services/:id
```

### Opciones de contacto

```txt
GET /contact-options
POST /contact-options
PATCH /contact-options/:id
DELETE /contact-options/:id
```

### Dashboard

```txt
GET /dashboard/summary
```

### Landing pública

```txt
GET /landing
```

Este endpoint devuelve en una sola petición los datos públicos necesarios para cargar la landing.

## Objetivo del proyecto

El objetivo de este backend es servir como base para una página profesional con funcionalidades reales de negocio:

* Captura de prospectos.
* Administración de servicios.
* Administración de proyectos.
* Gestión de usuarios.
* Seguimiento de mensajes.
* Métricas administrativas.
* Optimización de consultas públicas.

Esto permite que el proyecto funcione tanto como portafolio profesional como plantilla inicial para futuros sistemas o páginas web para clientes.

## Estado del proyecto

Proyecto en desarrollo activo.
