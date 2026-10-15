import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { projectExamples } from './project-examples';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL.');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const results = await prisma.$transaction(
      async (tx) => {
        // Evita duplicados si dos ejecuciones de este seed coinciden.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(104215)`;
        const results: string[] = [];
        for (const project of projectExamples) {
          const existing = await tx.project.findFirst({
            where: { title: { equals: project.title, mode: 'insensitive' } },
            select: { id: true },
          });
          if (existing) {
            results.push(`Conservado: ${project.title}`);
            continue;
          }
          await tx.project.create({
            data: { ...project, status: 'Demo conceptual', isActive: true },
          });
          results.push(`Creado: ${project.title}`);
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
    'No se completó la carga de ejemplos. Revisa la conexión a PostgreSQL.',
  );
  process.exitCode = 1;
});
