import { Module } from '@nestjs/common';
import { EnergyModule } from '../energy.module';
import { SyncController } from './sync.controller';
import { SyncScheduler } from './sync.scheduler';

@Module({
  imports: [EnergyModule],
  controllers: [SyncController],
  providers: [SyncScheduler],
})
export class SyncModule {}
