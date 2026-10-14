import { Module } from '@nestjs/common';
import { LeadAgentModule } from '../lead-agent/lead-agent.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactCommentsService } from './contact-comments.service';
import { ContactAnalysisService } from './contact-analysis.service';
import { ContactFollowUpService } from './contact-follow-up.service';

@Module({
  imports: [PrismaModule, LeadAgentModule],
  controllers: [ContactController],
  providers: [
    ContactService,
    ContactCommentsService,
    ContactAnalysisService,
    ContactFollowUpService,
  ],
})
export class ContactModule {}
