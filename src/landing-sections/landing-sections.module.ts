import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { LandingSectionsController } from './landing-sections.controller'
import { LandingSectionsService } from './landing-sections.service'

@Module({
  imports: [PrismaModule],
  controllers: [LandingSectionsController],
  providers: [LandingSectionsService],
  exports: [LandingSectionsService],
})
export class LandingSectionsModule {}