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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const report_filter_dto_1 = require("./dto/report-filter.dto");
const static_jwt_guard_1 = require("../common/guards/static-jwt.guard");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getTotal(filters) {
        return this.reportsService.getTotalConsumption(filters);
    }
    async getAverage(filters) {
        return this.reportsService.getAverageConsumption(filters);
    }
    async getPeak(filters) {
        return this.reportsService.getPeakConsumption(filters);
    }
    async getByRegion(filters) {
        return this.reportsService.getConsumptionByRegion(filters);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('total'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtém o consumo total no período' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sucesso' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filter_dto_1.ReportFilterDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTotal", null);
__decorate([
    (0, common_1.Get)('average'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtém a média de consumo no período' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sucesso' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filter_dto_1.ReportFilterDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getAverage", null);
__decorate([
    (0, common_1.Get)('peak'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtém o pico de consumo no período' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sucesso' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filter_dto_1.ReportFilterDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPeak", null);
__decorate([
    (0, common_1.Get)('by-region'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtém o consumo agrupado por região' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sucesso' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filter_dto_1.ReportFilterDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getByRegion", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Relatórios'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(static_jwt_guard_1.StaticJwtGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map