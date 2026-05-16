import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { ContactModule } from './contact/contact.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [HealthModule, ContactModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
