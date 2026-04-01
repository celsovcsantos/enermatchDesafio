import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EnergyModule } from '../energy.module';
import { SyncController } from './sync.controller';
import { SyncScheduler } from './sync.scheduler';

@Module({
  imports: [ScheduleModule.forRoot(), EnergyModule],
  controllers: [SyncController],
  providers: [SyncScheduler],
})
export class SyncModule {}
