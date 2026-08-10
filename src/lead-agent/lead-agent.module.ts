import { Module } from '@nestjs/common';
import { LeadAgentService } from './lead-agent.service';

@Module({
  providers: [LeadAgentService],
  exports: [LeadAgentService],
})
export class LeadAgentModule {}