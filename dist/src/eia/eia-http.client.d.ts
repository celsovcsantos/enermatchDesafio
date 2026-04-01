import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.schema';
export interface EiaResponse {
    response: {
        total: number;
        count: number;
        offset: number;
        data: Array<{
            period: string;
            respondent: string;
            respondentName: string;
            type: string;
            typeDescription: string;
            value: number;
            unit: string;
        }>;
    };
}
export declare class EiaHttpClient {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(httpService: HttpService, configService: ConfigService<Env>);
    getRegionData(params: {
        start?: string;
        end?: string;
        offset?: number;
        length?: number;
    }): Promise<EiaResponse>;
}
