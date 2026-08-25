import { Module } from '@nestjs/common';
import { TechnicalAgentController } from './technical-agent.controller';
import { TechnicalAgentService } from './technical-agent.service';

@Module({
  controllers: [TechnicalAgentController],
  providers: [TechnicalAgentService],
})
export class TechnicalAgentModule {}