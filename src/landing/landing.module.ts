import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';
import { LandingSectionsModule } from '../landing-sections/landing-sections.module';

@Module({
  imports: [PrismaModule,LandingSectionsModule],
  controllers: [LandingController],
  providers: [LandingService],
})
export class LandingModule {}