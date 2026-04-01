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
var SyncScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const energy_service_1 = require("../energy.service");
let SyncScheduler = SyncScheduler_1 = class SyncScheduler {
    energyService;
    logger = new common_1.Logger(SyncScheduler_1.name);
    constructor(energyService) {
        this.energyService = energyService;
    }
    async handleCron() {
        this.logger.log('Iniciando coleta automática de dados (Cron)');
        try {
            await this.energyService.syncData({});
            this.logger.log('Coleta automática concluída com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Falha na coleta automática: ${message}`);
        }
    }
};
exports.SyncScheduler = SyncScheduler;
__decorate([
    (0, schedule_1.Cron)(process.env.SYNC_CRON_EXPRESSION || schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncScheduler.prototype, "handleCron", null);
exports.SyncScheduler = SyncScheduler = SyncScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [energy_service_1.EnergyService])
], SyncScheduler);
//# sourceMappingURL=sync.scheduler.js.map