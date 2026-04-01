import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Env } from '../config/env.schema';
import { EiaIntegrationException } from '../common/exceptions/app.exception';

export interface EiaResponse {
  warnings?: Array<{
    warning: string;
    description: string;
  }>;
  response: {
    total: string;
    dateFormat: string;
    frequency: string;
    data: Array<{
      period: string;
      respondent: string;
      'respondent-name': string;
      type: string;
      'type-name': string;
      value: string;
      'value-units': string;
    }>;
    description?: string;
  };
  request?: {
    command: string;
    params: Record<string, unknown>;
  };
  apiVersion?: string;
  ExcelAddInVersion?: string;
}

@Injectable()
export class EiaHttpClient {
  private readonly logger = new Logger(EiaHttpClient.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<Env>,
  ) {
    this.apiKey = this.configService.get<string>('EIA_API_KEY')!;
    this.baseUrl = this.configService.get<string>('EIA_BASE_URL')!;
  }

  async getRegionData(params: { start?: string; end?: string; offset?: number; length?: number }): Promise<EiaResponse> {
    try {
      const url = `${this.baseUrl}/electricity/rto/region-data/data`;
      const response = await firstValueFrom(
        this.httpService.get<EiaResponse>(url, {
          params: {
            api_key: this.apiKey,
            frequency: 'hourly',
            data: ['value'],
            facets: {
              type: ['D'], // Demand
            },
            start: params.start,
            end: params.end,
            offset: params.offset || 0,
            length: params.length || 100,
          },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      const stack = error instanceof Error ? error.stack : undefined;

      if (error instanceof AxiosError) {
        this.logger.error(`Erro na API EIA (${error.response?.status}): ${JSON.stringify(error.response?.data)}`);
      }

      this.logger.error(`Erro ao consumir API EIA: ${message}`, stack);
      throw new EiaIntegrationException(`Falha na integração com a EIA: ${message}`);
    }
  }
}
