import { DataSource, Repository } from 'typeorm';
import { EnergyRecord } from './energy.entity';
export interface ReportFilters {
    start?: string;
    end?: string;
    region?: string;
}
export interface TotalResult {
    total: number | null;
    unit: string | null;
}
export interface AverageResult {
    average: number | null;
    unit: string | null;
}
export interface PeakResult {
    peak: number | null;
    period: string | null;
    region: string | null;
    unit: string | null;
}
export interface ByRegionResult {
    region: string;
    regionName: string;
    total: number;
    unit: string;
}
export declare class EnergyRepository extends Repository<EnergyRecord> {
    private dataSource;
    constructor(dataSource: DataSource);
    upsertRecords(records: Partial<EnergyRecord>[]): Promise<void>;
    private applyFilters;
    getTotalConsumption(filters: ReportFilters): Promise<TotalResult | undefined>;
    getAverageConsumption(filters: ReportFilters): Promise<AverageResult | undefined>;
    getPeakConsumption(filters: ReportFilters): Promise<PeakResult | undefined>;
    getConsumptionByRegion(filters: ReportFilters): Promise<ByRegionResult[]>;
}
