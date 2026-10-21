import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminProfilesController } from './admin-profiles.controller';
import { AdminProfilesService } from './admin-profiles.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminProfilesController],
  providers: [AdminProfilesService],
  exports: [AdminProfilesService],
})
export class AdminProfilesModule {}
