import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
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

@Injectable()
export class EnergyRepository extends Repository<EnergyRecord> {
  constructor(private dataSource: DataSource) {
    super(EnergyRecord, dataSource.createEntityManager());
  }

  async upsertRecords(records: Partial<EnergyRecord>[]) {
    if (records.length === 0) return;

    await this.createQueryBuilder()
      .insert()
      .into(EnergyRecord)
      .values(records)
      .orUpdate(['respondentName', 'typeDescription', 'value', 'unit', 'updatedAt'], ['period', 'respondent', 'type'])
      .execute();
  }

  private applyFilters(query: SelectQueryBuilder<EnergyRecord>, filters: ReportFilters) {
    if (filters.start) {
      query.andWhere('record.period >= :start', { start: filters.start });
    }
    if (filters.end) {
      query.andWhere('record.period <= :end', { end: filters.end });
    }
    if (filters.region) {
      query.andWhere('record.respondent = :region', {
        region: filters.region,
      });
    }
  }

  async getTotalConsumption(filters: ReportFilters): Promise<TotalResult | undefined> {
    const query = this.createQueryBuilder('record').select('SUM(record.value)', 'total').addSelect('record.unit', 'unit');

    this.applyFilters(query, filters);

    return query.groupBy('record.unit').getRawOne();
  }

  async getAverageConsumption(filters: ReportFilters): Promise<AverageResult | undefined> {
    const query = this.createQueryBuilder('record').select('AVG(record.value)', 'average').addSelect('record.unit', 'unit');

    this.applyFilters(query, filters);

    return query.groupBy('record.unit').getRawOne();
  }

  async getPeakConsumption(filters: ReportFilters): Promise<PeakResult | undefined> {
    const query = this.createQueryBuilder('record')
      .select('MAX(record.value)', 'peak')
      .addSelect('record.period', 'period')
      .addSelect('record.respondent', 'region')
      .addSelect('record.unit', 'unit');

    this.applyFilters(query, filters);

    return query.groupBy('record.period').addGroupBy('record.respondent').addGroupBy('record.unit').orderBy('peak', 'DESC').getRawOne();
  }

  async getConsumptionByRegion(filters: ReportFilters): Promise<ByRegionResult[]> {
    const query = this.createQueryBuilder('record')
      .select('record.respondent', 'region')
      .addSelect('record.respondentName', 'regionName')
      .select('SUM(record.value)', 'total')
      .addSelect('record.unit', 'unit');

    this.applyFilters(query, filters);

    return query.groupBy('record.respondent').addGroupBy('record.respondentName').addGroupBy('record.unit').getRawMany();
  }
}
