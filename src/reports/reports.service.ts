import { Injectable } from '@nestjs/common';
import { EnergyRepository } from '../energy/energy.repository';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly energyRepository: EnergyRepository) {}

  async getTotalConsumption(filters: ReportFilterDto) {
    return this.energyRepository.getTotalConsumption(filters);
  }

  async getAverageConsumption(filters: ReportFilterDto) {
    return this.energyRepository.getAverageConsumption(filters);
  }

  async getPeakConsumption(filters: ReportFilterDto) {
    return this.energyRepository.getPeakConsumption(filters);
  }

  async getConsumptionByRegion(filters: ReportFilterDto) {
    return this.energyRepository.getConsumptionByRegion(filters);
  }
}
