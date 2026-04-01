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
var EiaHttpClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EiaHttpClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const axios_2 = require("axios");
const app_exception_1 = require("../common/exceptions/app.exception");
let EiaHttpClient = EiaHttpClient_1 = class EiaHttpClient {
    httpService;
    configService;
    logger = new common_1.Logger(EiaHttpClient_1.name);
    apiKey;
    baseUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.apiKey = this.configService.get('EIA_API_KEY');
        this.baseUrl = this.configService.get('EIA_BASE_URL');
    }
    async getRegionData(params) {
        try {
            const url = `${this.baseUrl}/electricity/rto/region-data/data`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                params: {
                    api_key: this.apiKey,
                    frequency: 'hourly',
                    data: ['value'],
                    facets: {
                        type: ['D'],
                    },
                    start: params.start,
                    end: params.end,
                    offset: params.offset || 0,
                    length: params.length || 5000,
                },
            }));
            return response.data;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            const stack = error instanceof Error ? error.stack : undefined;
            if (error instanceof axios_2.AxiosError) {
                this.logger.error(`Erro na API EIA (${error.response?.status}): ${JSON.stringify(error.response?.data)}`);
            }
            this.logger.error(`Erro ao consumir API EIA: ${message}`, stack);
            throw new app_exception_1.EiaIntegrationException(`Falha na integração com a EIA: ${message}`);
        }
    }
};
exports.EiaHttpClient = EiaHttpClient;
exports.EiaHttpClient = EiaHttpClient = EiaHttpClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], EiaHttpClient);
//# sourceMappingURL=eia-http.client.js.map