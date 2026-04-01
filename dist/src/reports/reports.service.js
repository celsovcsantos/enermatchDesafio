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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const energy_repository_1 = require("../energy/energy.repository");
let ReportsService = class ReportsService {
    energyRepository;
    constructor(energyRepository) {
        this.energyRepository = energyRepository;
    }
    async getTotalConsumption(filters) {
        return this.energyRepository.getTotalConsumption(filters);
    }
    async getAverageConsumption(filters) {
        return this.energyRepository.getAverageConsumption(filters);
    }
    async getPeakConsumption(filters) {
        return this.energyRepository.getPeakConsumption(filters);
    }
    async getConsumptionByRegion(filters) {
        return this.energyRepository.getConsumptionByRegion(filters);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [energy_repository_1.EnergyRepository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map