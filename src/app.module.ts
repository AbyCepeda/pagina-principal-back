import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContactOptionsModule } from './contact-options/contact-options.module';
import { ContactModule } from './contact/contact.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { LandingSectionsModule } from './landing-sections/landing-sections.module';
import { LandingModule } from './landing/landing.module';
import { LeadAgentModule } from './lead-agent/lead-agent.module';
import { PlansModule } from './plans/plans.module';
import { ProjectsModule } from './projects/projects.module';
import { ServicesModule } from './services/services.module';
import { TechnicalAgentModule } from './technical-agent/technical-agent.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
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
    LeadAgentModule,
    LandingSectionsModule,
    TechnicalAgentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}