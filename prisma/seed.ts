import { PrismaClient, Role } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as bcrypt from 'bcrypt'

/**
 * Adapter de Prisma para conectarse a MySQL/MariaDB.
 *
 * Como usamos Prisma 7, PrismaClient necesita recibir un adapter.
 * Por eso NO usamos new PrismaClient() vacío.
 */
const adapter = new PrismaMariaDb({
  host: '127.0.0.1',
  port: 3308,
  user: 'pagina_user',
  password: 'pagina_password',
  database: 'pagina_principal_db',

  /**
   * Necesario para evitar el error:
   * RSA public key is not available client side
   */
  allowPublicKeyRetrieval: true,
})

const prisma = new PrismaClient({
  adapter,
})

/**
 * Seed inicial del sistema.
 *
 * Crea un usuario ADMIN si todavía no existe.
 * Esto permite entrar al panel cuando la base de datos está vacía.
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
    return
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  console.log('Usuario ADMIN creado correctamente:')
  console.log(admin)
}

main()
  .catch((error) => {
    console.error('Error ejecutando seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })