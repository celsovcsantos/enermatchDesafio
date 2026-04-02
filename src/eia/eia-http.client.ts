import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Env } from '../config/env.schema';
import {
  AppException,
  EiaAuthException,
  EiaIntegrationException,
  EiaInvalidResponseException,
  EiaRateLimitException,
  EiaServiceUnavailableException,
  EiaTimeoutException,
} from '../common/exceptions/app.exception';

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

/**
 * Códigos HTTP da EIA que devem acionar retry (erros transitórios do servidor).
 * Erros 4xx de client (400, 401, 403, 404) não são retentáveis.
 */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/**
 * Códigos de erro do Axios que indicam problema de rede/timeout (sempre retentável).
 */
const RETRYABLE_AXIOS_CODES = new Set(['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'ERR_NETWORK', 'ENOTFOUND']);

/**
 * Aguarda o número de milissegundos especificado.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calcula o delay com backoff exponencial com jitter para evitar thundering herd.
 * Formula: min(baseDelay * 2^attempt + jitter, maxDelay)
 */
export function calcBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * baseDelayMs);
  return Math.min(exponential + jitter, maxDelayMs);
}

@Injectable()
export class EiaHttpClient {
  private readonly logger = new Logger(EiaHttpClient.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly retryMaxDelayMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<Env>,
  ) {
    this.apiKey = this.configService.get<string>('EIA_API_KEY')!;
    this.baseUrl = this.configService.get<string>('EIA_BASE_URL')!;
    this.timeoutMs = this.configService.get<number>('EIA_TIMEOUT_MS') ?? 30000;
    this.maxRetries = this.configService.get<number>('EIA_MAX_RETRIES') ?? 3;
    this.retryDelayMs = this.configService.get<number>('EIA_RETRY_DELAY_MS') ?? 1000;
    this.retryMaxDelayMs = this.configService.get<number>('EIA_RETRY_MAX_DELAY_MS') ?? 30000;
  }

  async getRegionData(params: { start?: string; end?: string; offset?: number; length?: number }): Promise<EiaResponse> {
    const url = `${this.baseUrl}/electricity/rto/region-data/data`;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
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
              offset: params.offset ?? 0,
              length: params.length ?? 100,
            },
          }),
        );

        this.validateResponse(response.data);
        return response.data;
      } catch (error: unknown) {
        const typedException = this.classifyError(error);

        const isLastAttempt = attempt === this.maxRetries;
        const isRetryable = this.isRetryableException(typedException);

        if (!isRetryable || isLastAttempt) {
          if (isLastAttempt && isRetryable) {
            this.logger.error(`[EiaHttpClient] Todas as ${this.maxRetries + 1} tentativa(s) esgotadas. ` + `Último erro: ${typedException.message}`);
          }
          throw typedException;
        }

        const delay = calcBackoffDelay(attempt, this.retryDelayMs, this.retryMaxDelayMs);
        this.logger.warn(
          `[EiaHttpClient] Tentativa ${attempt + 1}/${this.maxRetries + 1} falhou ` +
            `(${typedException.constructor.name}: ${typedException.message}). ` +
            `Aguardando ${delay}ms antes de tentar novamente...`,
        );
        await sleep(delay);
      }
    }

    // Nunca deve chegar aqui — satisfaz o TypeScript
    throw new EiaIntegrationException('Falha inesperada no loop de retry da EIA');
  }

  /**
   * Valida se o payload da EIA tem a estrutura mínima esperada.
   * Lança EiaInvalidResponseException se estiver malformado.
   */
  private validateResponse(data: unknown): asserts data is EiaResponse {
    if (!data || typeof data !== 'object') {
      throw new EiaInvalidResponseException('payload não é um objeto');
    }

    const eiaData = data as Record<string, unknown>;

    if (!eiaData['response'] || typeof eiaData['response'] !== 'object') {
      throw new EiaInvalidResponseException('campo "response" ausente ou inválido');
    }

    const responseObj = eiaData['response'] as Record<string, unknown>;

    if (!Array.isArray(responseObj['data'])) {
      throw new EiaInvalidResponseException('campo "response.data" ausente ou não é array');
    }
  }

  /**
   * Classifica um erro bruto em uma exceção tipada da aplicação.
   * Determina se o erro é retentável ou não com base no tipo/status.
   */
  private classifyError(error: unknown): AppException {
    // Exceção já tipada — propaga diretamente (ex: EiaInvalidResponseException do validateResponse)
    if (error instanceof AppException) {
      return error;
    }

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const axiosCode = error.code;

      // Timeout (ECONNABORTED é o código do Axios para timeout configurado via `timeout`)
      if (axiosCode === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
        this.logger.error(`[EiaHttpClient] Timeout após ${this.timeoutMs}ms`);
        return new EiaTimeoutException(this.timeoutMs);
      }

      // Erros de rede sem resposta HTTP (servidor não alcançável)
      if (!status && axiosCode && RETRYABLE_AXIOS_CODES.has(axiosCode)) {
        this.logger.error(`[EiaHttpClient] Erro de rede (${axiosCode}): ${error.message}`);
        return new EiaServiceUnavailableException(`Falha de rede ao contatar a EIA: ${error.message}`);
      }

      if (status) {
        // Rate limit (429)
        if (status === 429) {
          const retryAfter = error.response?.headers?.['retry-after'] as string | undefined;
          const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined;
          this.logger.warn(`[EiaHttpClient] Rate limit da EIA atingido (429)`);
          return new EiaRateLimitException(retryAfterMs);
        }

        // Credenciais inválidas — não retentável
        if (status === 401 || status === 403) {
          this.logger.error(`[EiaHttpClient] Credenciais inválidas na EIA (${status})`);
          return new EiaAuthException();
        }

        // Erros de servidor retentáveis (500, 502, 503, 504)
        if (RETRYABLE_STATUS_CODES.has(status)) {
          this.logger.error(`[EiaHttpClient] Serviço EIA indisponível (${status}): ${JSON.stringify(error.response?.data)}`);
          return new EiaServiceUnavailableException(`EIA retornou status ${status}`);
        }

        // Outros erros HTTP não retentáveis (400, 404, etc.)
        this.logger.error(`[EiaHttpClient] Erro HTTP ${status} da EIA: ${JSON.stringify(error.response?.data)}`);
        return new EiaIntegrationException(`Erro ${status} na API EIA: ${error.message}`);
      }
    }

    // Erros genéricos desconhecidos
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(`[EiaHttpClient] Erro inesperado: ${message}`, stack);
    return new EiaIntegrationException(`Falha na integração com a EIA: ${message}`);
  }

  /**
   * Retorna true se a exceção representa um erro transitório que justifica retry.
   */
  private isRetryableException(exception: AppException): boolean {
    const retryableCodes = new Set(['EIA_SERVICE_UNAVAILABLE', 'EIA_TIMEOUT', 'EIA_RATE_LIMIT']);
    const responseBody = exception.getResponse() as { code?: string };
    return retryableCodes.has(responseBody?.code ?? '');
  }
}
