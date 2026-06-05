import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContactOptionsController } from './contact-options.controller';
import { ContactOptionsService } from './contact-options.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContactOptionsController],
  providers: [ContactOptionsService],
})
export class ContactOptionsModule {}