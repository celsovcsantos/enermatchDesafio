import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyRecord } from './energy.entity';
import { EnergyRepository } from './energy.repository';
import { EnergyService } from './energy.service';
import { EiaModule } from '../eia/eia.module';

@Module({
  imports: [TypeOrmModule.forFeature([EnergyRecord]), EiaModule],
  providers: [EnergyRepository, EnergyService],
  exports: [EnergyService, EnergyRepository],
})
export class EnergyModule {}
