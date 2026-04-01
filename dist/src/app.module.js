"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_module_1 = require("./config/config.module");
const database_module_1 = require("./database/database.module");
const sync_module_1 = require("./energy/sync/sync.module");
const reports_module_1 = require("./reports/reports.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.AppConfigModule,
            database_module_1.DatabaseModule,
            sync_module_1.SyncModule,
            reports_module_1.ReportsModule,
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    name: 'enermatchAPI',
                    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
                    transport: {
                        target: 'pino-pretty',
                        options: {
                            singleLine: true,
                            level: ['info', 'error', 'debug ', 'warn', 'fatal'],
                            minimumLevel: 0,
                            colorize: process.env.NODE_ENV === 'production' ? false : true,
                            translateTime: `yyyy-mm-dd HH:MM:ss.l Z`,
                            ignore: 'pid,hostname',
                        },
                    },
                },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            ttl: configService.get('THROTTLE_TTL') ?? 60,
                            limit: configService.get('THROTTLE_LIMIT') ?? 30,
                        },
                    ],
                }),
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map