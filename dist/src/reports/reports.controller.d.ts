import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getTotal(filters: ReportFilterDto): Promise<import("../energy/energy.repository").TotalResult | undefined>;
    getAverage(filters: ReportFilterDto): Promise<import("../energy/energy.repository").AverageResult | undefined>;
    getPeak(filters: ReportFilterDto): Promise<import("../energy/energy.repository").PeakResult | undefined>;
    getByRegion(filters: ReportFilterDto): Promise<import("../energy/energy.repository").ByRegionResult[]>;
}
