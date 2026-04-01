"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnergyRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const energy_entity_1 = require("./energy.entity");
let EnergyRepository = class EnergyRepository extends typeorm_1.Repository {
    dataSource;
    constructor(dataSource) {
        super(energy_entity_1.EnergyRecord, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    async upsertRecords(records) {
        if (records.length === 0)
            return;
        await this.createQueryBuilder()
            .insert()
            .into(energy_entity_1.EnergyRecord)
            .values(records)
            .orUpdate(['respondentName', 'typeDescription', 'value', 'unit', 'updatedAt'], ['period', 'respondent', 'type'])
            .execute();
    }
    applyFilters(query, filters) {
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
    async getTotalConsumption(filters) {
        const query = this.createQueryBuilder('record').select('SUM(record.value)', 'total').addSelect('record.unit', 'unit');
        this.applyFilters(query, filters);
        return query.groupBy('record.unit').getRawOne();
    }
    async getAverageConsumption(filters) {
        const query = this.createQueryBuilder('record').select('AVG(record.value)', 'average').addSelect('record.unit', 'unit');
        this.applyFilters(query, filters);
        return query.groupBy('record.unit').getRawOne();
    }
    async getPeakConsumption(filters) {
        const query = this.createQueryBuilder('record')
            .select('MAX(record.value)', 'peak')
            .addSelect('record.period', 'period')
            .addSelect('record.respondent', 'region')
            .addSelect('record.unit', 'unit');
        this.applyFilters(query, filters);
        return query.groupBy('record.period').addGroupBy('record.respondent').addGroupBy('record.unit').orderBy('peak', 'DESC').getRawOne();
    }
    async getConsumptionByRegion(filters) {
        const query = this.createQueryBuilder('record')
            .select('record.respondent', 'region')
            .addSelect('record.respondentName', 'regionName')
            .select('SUM(record.value)', 'total')
            .addSelect('record.unit', 'unit');
        this.applyFilters(query, filters);
        return query.groupBy('record.respondent').addGroupBy('record.respondentName').addGroupBy('record.unit').getRawMany();
    }
};
exports.EnergyRepository = EnergyRepository;
exports.EnergyRepository = EnergyRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], EnergyRepository);
//# sourceMappingURL=energy.repository.js.map