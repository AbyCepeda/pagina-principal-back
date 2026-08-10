import { Module } from '@nestjs/common';
import { LeadAgentModule } from '../lead-agent/lead-agent.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [PrismaModule, LeadAgentModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}