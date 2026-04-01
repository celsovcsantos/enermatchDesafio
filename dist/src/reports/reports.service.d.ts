import { EnergyRepository } from '../energy/energy.repository';
import { ReportFilterDto } from './dto/report-filter.dto';
export declare class ReportsService {
    private readonly energyRepository;
    constructor(energyRepository: EnergyRepository);
    getTotalConsumption(filters: ReportFilterDto): Promise<import("../energy/energy.repository").TotalResult | undefined>;
    getAverageConsumption(filters: ReportFilterDto): Promise<import("../energy/energy.repository").AverageResult | undefined>;
    getPeakConsumption(filters: ReportFilterDto): Promise<import("../energy/energy.repository").PeakResult | undefined>;
    getConsumptionByRegion(filters: ReportFilterDto): Promise<import("../energy/energy.repository").ByRegionResult[]>;
}
