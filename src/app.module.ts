import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { HealthModule } from './health/health.module';
import { ProjectsModule } from './projects/projects.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContactOptionsModule } from './contact-options/contact-options.module';
import { LandingModule } from './landing/landing.module';
import { PlansModule } from './plans/plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    ContactModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    ServicesModule,
    DashboardModule,
    ContactOptionsModule,
    LandingModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}