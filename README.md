# CepedaSoftware · API de cotización y seguimiento

Backend desarrollado con **NestJS**, **Prisma** y **PostgreSQL** para una landing profesional con panel administrativo, autenticación, gestión de contenido y seguimiento de mensajes de contacto.

Este proyecto forma parte de un portafolio profesional y también funciona como base reutilizable para crear páginas web o sistemas administrativos para clientes.

## Qué demuestra este proyecto

Una solicitud recorre un flujo de negocio: selección de paquete, estimación,
registro, revisión administrativa y conversación con el usuario. El servidor
calcula los importes, aplica permisos y conserva el desglose original.

Proyecto personal de Abimael Cepeda que complementa su experiencia en aplicaciones
internas e integración de sistemas. No se presenta como un producto contratado
por una empresa.

[Frontend](https://github.com/AbyCepeda/pagina-principal) ·
[Caso de estudio](https://github.com/AbyCepeda/pagina-principal/blob/main/docs/presentacion-portafolio.md)

### Decisiones técnicas

- API modular, con DTOs de entrada y guards de autenticación y roles.
- Prisma y PostgreSQL, con base local opcional mediante Docker Compose.
- Cotizador y planeador comparten un motor de esfuerzo por tareas.
- Cada solicitud cotizada guarda un snapshot de importes y supuestos.
- El seguimiento separa notas internas, respuesta pública y conversación.
- Jest y Supertest verifican contratos HTTP; Swagger documenta la API.

El planeador técnico usa reglas y catálogos; no es un modelo de lenguaje entrenado
ni una conexión a un proveedor de IA. Las tarifas y horas son provisionales.
La verificación de correo está pendiente y las solicitudes se vinculan por correo.
Las pruebas HTTP usan Prisma simulado, no una base de datos real.

## Tecnologías utilizadas

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
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

El módulo `contact` separa sus responsabilidades en:

* `contact.service.ts`: creación, cotización, límites y consulta de solicitudes.
* `contact-comments.service.ts`: permisos de conversación, comentarios y lectura.
* `contact-follow-up.service.ts`: seguimiento administrativo y auditoría de cambios.
* `contact-analysis.service.ts`: generación, guardado y auditoría del análisis técnico.
* `technical-analysis.rules.ts`: reglas de análisis independientes de la base de datos.
* `quote-estimator.ts`: tarifas y cálculo de cotizaciones en el servidor.

`contact.controller.ts` delega cada ruta al servicio correspondiente; los guards
y DTOs conservan la autenticación, los permisos y la validación. El tipo de usuario
autenticado se reutiliza desde el módulo `auth`. La relación de solicitudes por
correo se mantiene pendiente de la futura verificación de correo.

## Requisitos

Antes de ejecutar el proyecto necesitas tener instalado:

* Node.js
* npm
* PostgreSQL local o alojado (por ejemplo, Neon)
* Docker, opcional pero recomendado para la base de datos

## Instalación

```bash
npm ci
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`.

Ejemplo:

```env
DATABASE_URL="postgresql://pagina_user:CONTRASENA@127.0.0.1:5433/pagina_principal_db"
POSTGRES_DB=pagina_principal_db
POSTGRES_USER=pagina_user
POSTGRES_PASSWORD="CONTRASENA"
POSTGRES_PORT=5433
JWT_SECRET=""
```

> Importante: el archivo `.env` no debe subirse al repositorio.

`JWT_SECRET` es obligatorio y debe tener al menos 32 caracteres. Genera una clave
aleatoria con el siguiente comando y guarda el resultado en tu `.env` y en la
configuración del servidor (no en Git):

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

El backend no arranca si la clave falta o es demasiado corta. Cambiarla invalida
los tokens existentes y requiere iniciar sesión nuevamente. En cada petición
autenticada se consulta el usuario actual: las cuentas eliminadas o desactivadas
se rechazan, y los permisos usan el rol vigente en la base de datos.

## Base de datos PostgreSQL

### Instalación nueva con Docker

Copia `.env.example` a `.env` si todavía no tienes uno. Configura una contraseña
local aleatoria en `POSTGRES_PASSWORD` y la misma en `DATABASE_URL`. Si la
contraseña incluye caracteres reservados de una URL, codifícalos en
`DATABASE_URL`. Configura también `JWT_SECRET` y las variables del administrador
si vas a ejecutar el seed.

```bash
docker compose up -d --wait postgres
npm run db:generate
npm run db:deploy
```

Este flujo es para una base nueva y vacía. La migración `0_init_postgresql`
incluye todas las tablas, enums, índices y relaciones del esquema actual.
El puerto por defecto es `5433`, publicado únicamente en `127.0.0.1`.
Los datos se conservan en un volumen propio de PostgreSQL; el antiguo volumen
MySQL no se reutiliza ni se elimina. El Compose incluye la base de datos; el
backend y el frontend se ejecutan con npm.

Para detener la base conservando sus datos, usa `docker compose stop postgres`.
Cambiar `POSTGRES_PASSWORD` después de inicializar el volumen no cambia por sí
solo la contraseña existente en PostgreSQL.

Para crear futuras migraciones en tu base local de desarrollo:

```bash
npm run db:migrate -- --name nombre_del_cambio
```

Para consultar el estado del historial, usa `npm run db:status`.

### Base PostgreSQL existente (incluido Neon)

Conserva tu `DATABASE_URL` actual. Docker es opcional y las variables
`POSTGRES_*` solo configuran el contenedor local. No ejecutes la migración inicial
de creación sobre una base que ya contiene las tablas.

Antes de adoptar el nuevo historial, respalda la base y compara su esquema:

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma
```

Solo si no hay diferencias, y después de revisar cualquier historial ya existente
en `_prisma_migrations`, puedes registrar la migración inicial como aplicada:

```bash
npx prisma migrate resolve --applied 0_init_postgresql
```

Ese comando registra un baseline; no ejecuta el SQL de creación. Si aparecen
diferencias o migraciones de otro historial, revisa el caso antes de continuar.
En despliegues posteriores se usa `npm run db:deploy`. Consulta el procedimiento
de [baselining de Prisma](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining).

### Historial anterior

Las migraciones originales de MySQL se conservan en
`prisma/migrations-mysql-archive` como referencia. El directorio activo
`prisma/migrations` ahora usa PostgreSQL. Este cambio no transfiere datos de
MySQL a PostgreSQL; una transferencia requiere un proceso separado.

Ejecutar seed de datos iniciales:

Antes de ejecutarlo, configura `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en tu
`.env`. La contraseña debe ser única, aleatoria, tener al menos 15 caracteres y
no superar 72 bytes UTF-8 (límite de bcrypt). No publiques estas variables ni sus
valores. La configuración se valida antes de realizar cambios en la base de datos.

El seed crea la cuenta inicial con rol ADMIN y contraseña hasheada. Si ya existe
un ADMIN activo con ese correo, conserva su contraseña. Si el correo pertenece a
otra clase de cuenta o a una cuenta inactiva, se detiene sin modificarla.
Cambiar estas variables no cambia la contraseña de una cuenta existente: usa el
flujo de cambio de contraseña. Si anteriormente ejecutaste el seed con las
credenciales fijas del repositorio, cambia la contraseña de esa cuenta.

```bash
npm run seed
```

Para comprobar la validación sin conectarse a la base de datos:

```bash
npm run test:seed
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

## Integridad de cotizaciones

`POST /contact` acepta `quotePlanSlug` y `quoteExtraIds` para seleccionar un
paquete y sus extras. Consulta el paquete activo en la base de datos y calcula
precios, presupuesto sugerido, complejidad, tiempo y snapshot en el servidor.
Los importes y los snapshots enviados por el cliente se rechazan con HTTP 400.
No requiere migraciones adicionales y conserva las cotizaciones anteriores.

Ejemplo de selección en una solicitud de contacto:

```json
{
  "name": "Cliente de prueba",
  "email": "cliente@example.com",
  "projectType": "Landing page",
  "budget": "Presupuesto aproximado",
  "message": "Necesito una página para mi negocio.",
  "quotePlanSlug": "landing-basica",
  "quoteExtraIds": ["custom-design"]
}
```

El frontend obtiene el catálogo de `GET /contact/quote-catalog` y solicita la
vista previa a `POST /contact/quote-preview`, sin autenticación. No conserva
tarifas fijas propias. Si la consulta falla, permite reintentar o continuar sin
paquete y bloquea el envío de una cotización pendiente. El servidor recalcula
al guardar y conserva la autoridad sobre los importes.

Los supuestos iniciales son 300 MXN/h, 20 h/semana y 15% de reserva: no son
tarifas de mercado ni tiempos calibrados. Los paquetes personalizados sin alcance
registrado quedan con precio y plazo por definir. Los registros históricos
conservan sus importes. Consulta [Paquetes y cotizador](docs/paquetes-y-cotizador.md)
y [Estimación por horas](docs/estimacion-por-horas.md).

## Pruebas con Jest y Supertest

Desde la carpeta del backend:

```bash
npm test
```

Este comando ejecuta las pruebas unitarias y las pruebas HTTP. También puedes
usar `npm run test:unit`, `npm run test:e2e`, `npm run test:watch` y
`npm run test:cov`. `npm run test:seed` ahora utiliza Jest.

Las pruebas HTTP arrancan una instancia de Nest en un puerto temporal y usan
Supertest contra los controladores, servicios, validación y guards reales.
Reemplazan únicamente Prisma por datos en memoria; no requieren Docker, el
backend iniciado ni una conexión a PostgreSQL, y no modifican datos reales.
Esto sigue el enfoque de [pruebas de NestJS](https://docs.nestjs.com/fundamentals/testing).

La suite inicial comprueba login y registro, hashes de contraseñas, datos
sensibles en respuestas, validación de cuerpos y filtros, tokens expirados o
firmados con otra clave, y permisos actualizados al desactivar, eliminar o
cambiar el rol de una cuenta. No comprueba todavía migraciones, consultas contra
PostgreSQL real, todo el CRUD ni el frontend.

Las pruebas unitarias están en `src/**/*.spec.ts` y
`test/**/*.unit-spec.ts`; las de la API en `test/**/*.e2e-spec.ts`.
`src/configure-app.ts` comparte la configuración HTTP entre producción y pruebas
para evitar diferencias en la validación. El archivo `test/setup-env.ts` utiliza
credenciales exclusivas de pruebas y desactiva Swagger para la suite HTTP.

## Documentación interactiva (Swagger)

Con el backend en ejecución, abre `http://localhost:4000/docs`.
La especificación OpenAPI está disponible en `http://localhost:4000/docs-json`.
Si cambias `PORT`, usa ese puerto en ambas direcciones.

La documentación incluye todos los endpoints, agrupados por módulo, con sus
cuerpos de entrada, filtros, parámetros, códigos de respuesta y permisos.
Los esquemas de los DTOs se generan con el plugin oficial de Swagger durante
`npm run build` y `npm run start:dev`; los DTOs de actualización heredan los campos
opcionales mediante `PartialType` de `@nestjs/swagger`.

Para probar rutas protegidas:

1. Ejecuta `POST /auth/login` con una cuenta activa.
2. Copia `data.accessToken` de la respuesta.
3. Pulsa **Authorize**, pega únicamente el token y confirma.
4. Prueba el endpoint. Las rutas marcadas ADMIN requieren ese rol.

La autorización no se conserva al recargar la página. Para desactivar tanto la
interfaz como la especificación, configura `SWAGGER_ENABLED=false` y reinicia
el backend. Swagger documenta los permisos; los guards existentes los aplican.

Para verificar la cobertura y los esquemas sin conectarse a una base de datos:

```bash
npm run test:swagger
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
GET /contact/unread-count
GET /contact/quote-catalog
POST /contact/quote-preview
GET /contact/my-messages
GET /contact/comments/unread-count
GET /contact/:id/comments
POST /contact/:id/comments
POST /contact/:id/technical-analysis
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

### Política de contraseñas

Registro, creación de usuarios, cambio de contraseña y seed requieren contraseñas
nuevas de al menos 15 caracteres Unicode, con algún carácter distinto de espacios,
y hasta 72 bytes UTF-8 (el límite de bcrypt). Se permiten frases, acentos, emojis y
espacios; la contraseña se conserva exactamente, sin recortarla. El frontend
anticipa esos errores y el backend siempre valida independientemente.

El login y la contraseña actual conservan compatibilidad con claves anteriores de
6 caracteres o más, incluyendo las que excedían 72 bytes por la antigua validación.
Sus entradas están limitadas a 1024 caracteres. No se cambian los hashes existentes
ni se ejecuta el seed. bcrypt sigue usando coste 10. Esta política no comprueba
todavía si la contraseña aparece en filtraciones.

### Límites de autenticación

Por IP y por ruta: login y cambio de contraseña permiten 10 peticiones por
minuto; registro permite 5. Se cuentan también solicitudes fallidas o inválidas.
Al exceder el límite, la API responde 429 y `Retry-After` indica los segundos de
bloqueo restantes (bloqueo de 60 segundos). Las otras rutas conservan su límite.

El contador está en memoria por instancia y se reinicia con el proceso. Antes de
desplegar varias instancias se necesita almacenamiento compartido. En un despliegue
con proxy se debe configurar explícitamente la confianza en el proxy según la
infraestructura: actualmente se usa la IP de la conexión y no se confía en
`X-Forwarded-For` enviado por el cliente. Usuarios que comparten IP comparten estos
límites. No se bloquean ni desactivan cuentas en la base de datos.

### Respuestas del inicio de sesión

`POST /auth/login` devuelve el mismo código 401 y mensaje cuando el correo no
existe, la contraseña es incorrecta o la cuenta está inactiva. El mensaje recuerda
que las cuentas pendientes requieren activación sin confirmar el estado del correo
enviado. También se ejecuta una comparación bcrypt con un hash auxiliar para
correos inexistentes, reduciendo la diferencia de trabajo entre esos casos. Esto
no garantiza tiempos idénticos ni elimina las diferencias de otras rutas: el
registro público aún responde 409 si un correo ya está registrado.

Proyecto en desarrollo activo.
