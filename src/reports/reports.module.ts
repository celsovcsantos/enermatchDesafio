import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { EnergyModule } from '../energy/energy.module';

@Module({
  imports: [EnergyModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
