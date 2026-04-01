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
var EnergyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnergyService = void 0;
const common_1 = require("@nestjs/common");
const eia_http_client_1 = require("../eia/eia-http.client");
const energy_repository_1 = require("./energy.repository");
const app_exception_1 = require("../common/exceptions/app.exception");
let EnergyService = EnergyService_1 = class EnergyService {
    eiaHttpClient;
    energyRepository;
    logger = new common_1.Logger(EnergyService_1.name);
    constructor(eiaHttpClient, energyRepository) {
        this.eiaHttpClient = eiaHttpClient;
        this.energyRepository = energyRepository;
    }
    async syncData(params) {
        this.logger.log(`Iniciando sincronização de dados: ${JSON.stringify(params)}`);
        try {
            const eiaData = await this.eiaHttpClient.getRegionData(params);
            if (!eiaData.response.data || eiaData.response.data.length === 0) {
                this.logger.warn('Nenhum dado retornado pela API EIA para o período informado.');
                return { count: 0, message: 'Nenhum dado encontrado' };
            }
            await this.energyRepository.upsertRecords(eiaData.response.data);
            this.logger.log(`Sincronização concluída com sucesso. ${eiaData.response.data.length} registros processados.`);
            return {
                count: eiaData.response.data.length,
                message: 'Sincronização concluída com sucesso',
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Erro durante a sincronização: ${message}`);
            throw new app_exception_1.SyncException(`Falha ao sincronizar dados: ${message}`);
        }
    }
};
exports.EnergyService = EnergyService;
exports.EnergyService = EnergyService = EnergyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [eia_http_client_1.EiaHttpClient,
        energy_repository_1.EnergyRepository])
], EnergyService);
//# sourceMappingURL=energy.service.js.map