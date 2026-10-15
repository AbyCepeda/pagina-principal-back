import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const services = [
  {
    title: 'Páginas web para negocios',
    description:
      'Presenta tus servicios, muestra tu trabajo y facilita que tus clientes te contacten desde cualquier dispositivo.',
    icon: '🌐',
  },
  {
    title: 'Sistemas administrativos',
    description:
      'Organiza clientes, citas, productos y procesos en una herramienta adaptada a la operación de tu negocio.',
    icon: '🗂️',
  },
  {
    title: 'Backend y APIs REST',
    description:
      'Conecta tu aplicación con una base de datos, administra accesos y desarrolla la lógica que necesita tu sistema.',
    icon: '⚙️',
  },
  {
    title: 'Mejoras a sistemas existentes',
    description:
      'Agrega funcionalidades, corrige problemas y mejora la experiencia de uso de una aplicación que ya tienes.',
    icon: '🛠️',
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta configurar DATABASE_URL.');
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const results = await prisma.$transaction(
      async (tx) => {
        const results: string[] = [];
        for (const service of services) {
          const existing = await tx.service.findFirst({
            where: { title: { equals: service.title, mode: 'insensitive' } },
            select: { id: true, isActive: true },
          });
          if (existing) {
            results.push(
              `Conservado: ${service.title} (${existing.isActive ? 'activo' : 'oculto'})`,
            );
            continue;
          }
          await tx.service.create({ data: { ...service, isActive: true } });
          results.push(`Creado: ${service.title}`);
        }
        return results;
      },
      { timeout: 30000 },
    );
    results.forEach((result) => console.log(result));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error(
    'No se pudo completar la carga de servicios. Revisa DATABASE_URL y la conexión a PostgreSQL.',
  );
  process.exitCode = 1;
});
