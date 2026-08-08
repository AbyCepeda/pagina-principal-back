import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function getAllowedOrigins() {
  const localOrigins = ['http://localhost:5173', 'http://localhost:5174'];

  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    return localOrigins;
  }

  return [...localOrigins, frontendUrl];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 4000;

  await app.listen(port);

  console.log(`Backend corriendo en puerto ${port}`);
}

bootstrap();