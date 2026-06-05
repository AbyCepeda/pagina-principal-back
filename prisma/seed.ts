import { ContactOptionType, PrismaClient, Role } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as bcrypt from 'bcrypt'

/**
 * Adapter de Prisma para conectarse a MySQL/MariaDB.
 *
 * Como usamos Prisma 7, PrismaClient necesita recibir un adapter.
 * Por eso NO usamos new PrismaClient() vacío.
 */
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? '127.0.0.1',
  port: Number(process.env.DATABASE_PORT ?? 3308),
  user: process.env.DATABASE_USER ?? 'root',
  password: process.env.DATABASE_PASSWORD ?? 'root',
  database: process.env.DATABASE_NAME ?? 'pagina_principal_db',
  allowPublicKeyRetrieval: true,
})

const prisma = new PrismaClient({
  adapter,
})

/**
 * Seed inicial del sistema.
 *
 * Crea/verifica:
 * - Usuario ADMIN inicial
 * - Opciones iniciales del formulario de contacto
 */
async function main() {
  const adminEmail = 'admin@test.com'
  const adminPassword = '123456'

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  })

  if (existingAdmin) {
    console.log(`El usuario admin ya existe: ${adminEmail}`)
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    console.log('Usuario ADMIN creado correctamente:')
    console.log(admin)
  }

  const contactOptions = [
    {
      type: ContactOptionType.PROJECT_TYPE,
      label: 'Página web',
      value: 'Página web',
      sortOrder: 1,
    },
    {
      type: ContactOptionType.PROJECT_TYPE,
      label: 'App móvil',
      value: 'App móvil',
      sortOrder: 2,
    },
    {
      type: ContactOptionType.PROJECT_TYPE,
      label: 'Sistema administrativo',
      value: 'Sistema administrativo',
      sortOrder: 3,
    },
    {
      type: ContactOptionType.PROJECT_TYPE,
      label: 'Tienda en línea',
      value: 'Tienda en línea',
      sortOrder: 4,
    },
    {
      type: ContactOptionType.PROJECT_TYPE,
      label: 'Landing page',
      value: 'Landing page',
      sortOrder: 5,
    },
    {
      type: ContactOptionType.PROJECT_TYPE,
      label: 'Mantenimiento o mejora',
      value: 'Mantenimiento o mejora',
      sortOrder: 6,
    },
    {
      type: ContactOptionType.PROJECT_TYPE,
      label: 'Otro',
      value: 'Otro',
      sortOrder: 7,
    },
    {
      type: ContactOptionType.BUDGET,
      label: 'Menos de $5,000 MXN',
      value: 'Menos de $5,000 MXN',
      sortOrder: 1,
    },
    {
      type: ContactOptionType.BUDGET,
      label: '$5,000 - $10,000 MXN',
      value: '$5,000 - $10,000 MXN',
      sortOrder: 2,
    },
    {
      type: ContactOptionType.BUDGET,
      label: '$10,000 - $20,000 MXN',
      value: '$10,000 - $20,000 MXN',
      sortOrder: 3,
    },
    {
      type: ContactOptionType.BUDGET,
      label: '$20,000 - $40,000 MXN',
      value: '$20,000 - $40,000 MXN',
      sortOrder: 4,
    },
    {
      type: ContactOptionType.BUDGET,
      label: 'Más de $40,000 MXN',
      value: 'Más de $40,000 MXN',
      sortOrder: 5,
    },
    {
      type: ContactOptionType.BUDGET,
      label: 'Aún no lo sé',
      value: 'Aún no lo sé',
      sortOrder: 6,
    },
  ]

  for (const option of contactOptions) {
    await prisma.contactOption.upsert({
      where: {
        type_value: {
          type: option.type,
          value: option.value,
        },
      },
      update: {
        label: option.label,
        sortOrder: option.sortOrder,
        isActive: true,
      },
      create: {
        type: option.type,
        label: option.label,
        value: option.value,
        sortOrder: option.sortOrder,
        isActive: true,
      },
    })
  }

  console.log('Opciones de contacto verificadas correctamente.')
}

main()
  .catch((error) => {
    console.error('Error ejecutando seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })