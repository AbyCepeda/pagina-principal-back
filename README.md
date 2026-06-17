# Página Principal Front

Frontend desarrollado con **React**, **TypeScript**, **Vite**, **TailwindCSS** y **Redux Toolkit** para una landing profesional con panel administrativo, autenticación, gestión de contenido y formulario de contacto.

Este proyecto forma parte de un portafolio profesional y también funciona como base reutilizable para vender páginas web o sistemas administrativos a clientes.

## Tecnologías utilizadas

* React
* TypeScript
* Vite
* TailwindCSS
* Redux Toolkit
* RTK Query
* React Redux
* React Router DOM
* Sonner

## Funcionalidades principales

* Landing pública profesional.
* Diseño responsive para móvil, tablet y desktop.
* Tema claro y oscuro.
* Selector de color principal.
* Secciones públicas:

  * Inicio.
  * Servicios.
  * Soluciones.
  * Beneficios.
  * Proyectos.
  * Tecnologías.
  * Proceso de trabajo.
  * Preguntas frecuentes.
  * Contacto.
* Formulario de contacto conectado al backend.
* Si el usuario está logueado, el formulario usa automáticamente el correo de su sesión.
* Autenticación con JWT.
* Rutas protegidas.
* Panel administrativo.
* Dashboard admin con métricas.
* Gestión de usuarios.
* Gestión de servicios.
* Gestión de proyectos.
* Gestión de opciones de contacto.
* Gestión de mensajes tipo mini CRM:

  * Estado.
  * Prioridad.
  * Notas internas.
  * Lectura.
  * Eliminación.
* Consumo optimizado de datos públicos mediante un solo endpoint:

  * `GET /landing`
* SEO básico:

  * Meta title.
  * Meta description.
  * Open Graph.
  * Twitter cards.
  * `robots.txt`.
  * `sitemap.xml`.

## Estructura general

```txt
src/
  admin/
  components/
  data/
  pages/
  services/
  store/
  types/
```

## Requisitos

Antes de ejecutar el proyecto necesitas tener instalado:

* Node.js
* npm
* Backend del proyecto ejecutándose localmente o desplegado

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`.

Ejemplo:

```env
VITE_API_URL="http://localhost:4000"
```

> Importante: el archivo `.env` no debe subirse al repositorio.

## Ejecutar en desarrollo

```bash
npm run dev
```

Por defecto, Vite ejecuta el frontend en:

```txt
http://localhost:5173
```

o en otro puerto disponible si `5173` ya está ocupado.

## Compilar proyecto

```bash
npm run build
```

## Previsualizar build de producción

```bash
npm run preview
```

## Revisar lint

```bash
npm run lint
```

## Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Conexión con backend

El frontend consume una API desarrollada con NestJS, Prisma y MySQL/MariaDB.

Endpoints principales usados por el frontend:

```txt
POST /auth/login
POST /auth/register
GET /auth/me
PATCH /auth/profile
PATCH /auth/change-password

GET /landing

POST /contact
GET /contact
PATCH /contact/:id
PATCH /contact/:id/read
DELETE /contact/:id

GET /dashboard/summary

GET /users
PATCH /users/:id/role
PATCH /users/:id/status
DELETE /users/:id

GET /projects
POST /projects
PATCH /projects/:id
DELETE /projects/:id

GET /services
POST /services
PATCH /services/:id
DELETE /services/:id

GET /contact-options
POST /contact-options
PATCH /contact-options/:id
DELETE /contact-options/:id
```

## Objetivo del proyecto

El objetivo de este frontend es presentar una página profesional moderna y funcional que sirva como portafolio personal y como base para futuros proyectos comerciales.

El proyecto demuestra habilidades en:

* Desarrollo frontend moderno.
* Diseño responsive.
* Consumo de APIs.
* Manejo de estado global.
* Autenticación.
* Rutas protegidas.
* Paneles administrativos.
* Formularios conectados a backend.
* Gestión de contenido dinámico.
* Optimización de peticiones públicas.
* Uso de temas visuales personalizables.

## Estado del proyecto

Proyecto en desarrollo activo.
