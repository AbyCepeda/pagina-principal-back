import { ValidationPipe, type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { setupSwagger } from './swagger';

export function configureApp(app: INestApplication) {
  const origins = ['http://localhost:5173', 'http://localhost:5174'];
  if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL);
  app.use(helmet());
  app.enableCors({
    origin: origins,
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
  if (process.env.SWAGGER_ENABLED !== 'false') setupSwagger(app);
}
