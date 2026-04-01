"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EiaModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const eia_http_client_1 = require("./eia-http.client");
let EiaModule = class EiaModule {
};
exports.EiaModule = EiaModule;
exports.EiaModule = EiaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    timeout: configService.get('EIA_TIMEOUT_MS'),
                    maxRedirects: 5,
                }),
            }),
        ],
        providers: [eia_http_client_1.EiaHttpClient],
        exports: [eia_http_client_1.EiaHttpClient],
    })
], EiaModule);
//# sourceMappingURL=eia.module.js.map