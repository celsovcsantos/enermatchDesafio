import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { EiaHttpClient, EiaResponse, calcBackoffDelay } from './eia-http.client';
import {
  EiaAuthException,
  EiaIntegrationException,
  EiaInvalidResponseException,
  EiaRateLimitException,
  EiaServiceUnavailableException,
  EiaTimeoutException,
} from '../common/exceptions/app.exception';

describe('EiaHttpClient', () => {
  let client: EiaHttpClient;
  let httpService: HttpService;

  const mockResponse: EiaResponse = {
    response: {
      total: '1',
      dateFormat: 'YYYY-MM-DD"T"HH24',
      frequency: 'hourly',
      data: [
        {
          period: '2024-01-01T00',
          respondent: 'PJM',
          'respondent-name': 'PJM Interconnection',
          type: 'D',
          'type-name': 'Demand',
          value: '1000',
          'value-units': 'megawatthours',
        },
      ],
    },
  };

  const createMockConfig = (): InternalAxiosRequestConfig =>
    ({
      headers: {},
    }) as InternalAxiosRequestConfig;

  /**
   * Cria um AxiosError com status HTTP e código de erro configuráveis.
   */
  function makeAxiosError(status?: number, code?: string, message = 'Request failed'): AxiosError<Record<string, unknown>> {
    const error = new AxiosError<Record<string, unknown>>(
      message,
      code ?? 'ERR_BAD_RESPONSE',
      createMockConfig(),
      {},
      status
        ? {
            data: { message: 'Error details' },
            status,
            statusText: 'Error',
            headers: {},
            config: createMockConfig(),
          }
        : undefined,
    );
    return error;
  }

  /**
   * Cria módulo de teste com delay de 1ms para tornar os testes de retry rápidos.
   */
  async function buildModule(overrideConfig?: Record<string, string | number>) {
    const defaultConfig: Record<string, string | number> = {
      EIA_API_KEY: 'test-api-key',
      EIA_BASE_URL: 'https://api.eia.gov/v2',
      EIA_TIMEOUT_MS: 5000,
      EIA_MAX_RETRIES: 2,
      EIA_RETRY_DELAY_MS: 1, // 1ms: testes rápidos sem fake timers
      EIA_RETRY_MAX_DELAY_MS: 10, // 10ms máximo
    };
    const config = { ...defaultConfig, ...overrideConfig };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EiaHttpClient,
        {
          provide: HttpService,
          useValue: { get: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => config[key]),
          },
        },
      ],
    }).compile();

    return {
      client: module.get<EiaHttpClient>(EiaHttpClient),
      httpService: module.get<HttpService>(HttpService),
    };
  }

  beforeEach(async () => {
    const built = await buildModule();
    client = built.client;
    httpService = built.httpService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Cenários de sucesso
  // ---------------------------------------------------------------------------
  describe('getRegionData — sucesso', () => {
    it('deve retornar dados da API EIA com sucesso', async () => {
      const mockAxiosResponse: AxiosResponse<EiaResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: createMockConfig(),
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockAxiosResponse));

      const result = await client.getRegionData({ start: '2024-01-01T00', end: '2024-01-31T23' });

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.eia.gov/v2/electricity/rto/region-data/data',
        expect.objectContaining({ params: expect.any(Object) as object }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('deve usar valores padrão para offset e length', async () => {
      (httpService.get as jest.Mock).mockReturnValue(of({ data: mockResponse, status: 200, statusText: 'OK', headers: {}, config: createMockConfig() }));
      await client.getRegionData({});
      expect(httpService.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ params: expect.any(Object) as object }));
    });

    it('deve usar valores customizados para offset e length', async () => {
      (httpService.get as jest.Mock).mockReturnValue(of({ data: mockResponse, status: 200, statusText: 'OK', headers: {}, config: createMockConfig() }));
      await client.getRegionData({ offset: 100, length: 1000 });
      expect(httpService.get).toHaveBeenCalledTimes(1);
    });

    it('deve passar facets de type corretamente', async () => {
      (httpService.get as jest.Mock).mockReturnValue(of({ data: mockResponse, status: 200, statusText: 'OK', headers: {}, config: createMockConfig() }));
      await client.getRegionData({});
      const callArgs = (httpService.get as jest.Mock).mock.calls[0] as [string, { params: Record<string, unknown> }];
      expect(callArgs[1].params['facets']).toEqual({ type: ['D'] });
    });
  });

  // ---------------------------------------------------------------------------
  // Validação de resposta
  // ---------------------------------------------------------------------------
  describe('getRegionData — validação de resposta', () => {
    it('deve lançar EiaInvalidResponseException quando payload não é objeto', async () => {
      (httpService.get as jest.Mock).mockReturnValue(of({ data: null, status: 200, statusText: 'OK', headers: {}, config: createMockConfig() }));
      // EiaInvalidResponseException não é retentável: rejeita imediatamente
      await expect(client.getRegionData({})).rejects.toThrow(EiaInvalidResponseException);
    });

    it('deve lançar EiaInvalidResponseException quando campo response está ausente', async () => {
      (httpService.get as jest.Mock).mockReturnValue(of({ data: { foo: 'bar' }, status: 200, statusText: 'OK', headers: {}, config: createMockConfig() }));
      await expect(client.getRegionData({})).rejects.toThrow(EiaInvalidResponseException);
    });

    it('deve lançar EiaInvalidResponseException quando response.data não é array', async () => {
      (httpService.get as jest.Mock).mockReturnValue(
        of({
          data: { response: { data: 'not-an-array' } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: createMockConfig(),
        }),
      );
      await expect(client.getRegionData({})).rejects.toThrow(EiaInvalidResponseException);
    });
  });

  // ---------------------------------------------------------------------------
  // Classificação de erros — sem retry (EIA_MAX_RETRIES=0)
  // ---------------------------------------------------------------------------
  describe('getRegionData — classificação de erros (sem retry)', () => {
    let noRetryClient: EiaHttpClient;
    let noRetryHttpService: HttpService;

    beforeEach(async () => {
      const built = await buildModule({ EIA_MAX_RETRIES: 0 });
      noRetryClient = built.client;
      noRetryHttpService = built.httpService;
    });

    it('deve lançar EiaTimeoutException em timeout (ECONNABORTED)', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(undefined, 'ECONNABORTED', 'timeout of 5000ms exceeded')));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaTimeoutException);
    });

    it('deve lançar EiaServiceUnavailableException em erro de rede sem status', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(undefined, 'ECONNRESET', 'socket hang up')));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaServiceUnavailableException);
    });

    it('deve lançar EiaRateLimitException para status 429', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(429)));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaRateLimitException);
    });

    it('deve lançar EiaAuthException para status 401', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(401)));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaAuthException);
    });

    it('deve lançar EiaAuthException para status 403', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(403)));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaAuthException);
    });

    it('deve lançar EiaServiceUnavailableException para status 500', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(500)));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaServiceUnavailableException);
    });

    it('deve lançar EiaServiceUnavailableException para status 503', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(503)));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaServiceUnavailableException);
    });

    it('deve lançar EiaServiceUnavailableException para status 504', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(504)));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaServiceUnavailableException);
    });

    it('deve lançar EiaIntegrationException para status 400 (não retentável)', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(400)));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaIntegrationException);
    });

    it('deve lançar EiaIntegrationException para erros genéricos desconhecidos', async () => {
      (noRetryHttpService.get as jest.Mock).mockReturnValue(throwError(() => new Error('Erro inesperado')));
      await expect(noRetryClient.getRegionData({})).rejects.toThrow(EiaIntegrationException);
    });
  });

  // ---------------------------------------------------------------------------
  // Lógica de retry (delays de 1ms para testes rápidos)
  // ---------------------------------------------------------------------------
  describe('getRegionData — lógica de retry', () => {
    it('deve retornar sucesso se recuperar na segunda tentativa (503 → 200)', async () => {
      const successResponse: AxiosResponse<EiaResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: createMockConfig(),
      };

      (httpService.get as jest.Mock).mockReturnValueOnce(throwError(() => makeAxiosError(503))).mockReturnValueOnce(of(successResponse));

      const result = await client.getRegionData({});

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });

    it('deve retornar sucesso se recuperar na terceira tentativa (503 → 503 → 200)', async () => {
      const successResponse: AxiosResponse<EiaResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: createMockConfig(),
      };

      (httpService.get as jest.Mock)
        .mockReturnValueOnce(throwError(() => makeAxiosError(503)))
        .mockReturnValueOnce(throwError(() => makeAxiosError(503)))
        .mockReturnValueOnce(of(successResponse));

      const result = await client.getRegionData({});

      expect(httpService.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockResponse);
    });

    it('deve lançar EiaServiceUnavailableException após esgotar todas as tentativas', async () => {
      // EIA_MAX_RETRIES=2: 3 tentativas totais, todas falham com 503
      (httpService.get as jest.Mock)
        .mockReturnValueOnce(throwError(() => makeAxiosError(503)))
        .mockReturnValueOnce(throwError(() => makeAxiosError(503)))
        .mockReturnValueOnce(throwError(() => makeAxiosError(503)));

      await expect(client.getRegionData({})).rejects.toThrow(EiaServiceUnavailableException);
      expect(httpService.get).toHaveBeenCalledTimes(3);
    });

    it('não deve retentar erro 401 (não retentável)', async () => {
      (httpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(401)));

      await expect(client.getRegionData({})).rejects.toThrow(EiaAuthException);
      // Deve chamar apenas 1 vez (sem retry)
      expect(httpService.get).toHaveBeenCalledTimes(1);
    });

    it('não deve retentar erro 400 (não retentável)', async () => {
      (httpService.get as jest.Mock).mockReturnValue(throwError(() => makeAxiosError(400)));

      await expect(client.getRegionData({})).rejects.toThrow(EiaIntegrationException);
      expect(httpService.get).toHaveBeenCalledTimes(1);
    });

    it('não deve retentar EiaInvalidResponseException (não retentável)', async () => {
      // Resposta malformada — sem campo "response"
      (httpService.get as jest.Mock).mockReturnValue(of({ data: { foo: 'bar' }, status: 200, statusText: 'OK', headers: {}, config: createMockConfig() }));

      await expect(client.getRegionData({})).rejects.toThrow(EiaInvalidResponseException);
      expect(httpService.get).toHaveBeenCalledTimes(1);
    });

    it('deve retentar em timeout', async () => {
      const successResponse: AxiosResponse<EiaResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: createMockConfig(),
      };

      (httpService.get as jest.Mock)
        .mockReturnValueOnce(throwError(() => makeAxiosError(undefined, 'ECONNABORTED', 'timeout of 5000ms exceeded')))
        .mockReturnValueOnce(of(successResponse));

      const result = await client.getRegionData({});

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });

    it('deve retentar em erro de rede (ECONNRESET)', async () => {
      const successResponse: AxiosResponse<EiaResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: createMockConfig(),
      };

      (httpService.get as jest.Mock)
        .mockReturnValueOnce(throwError(() => makeAxiosError(undefined, 'ECONNRESET', 'socket hang up')))
        .mockReturnValueOnce(of(successResponse));

      const result = await client.getRegionData({});

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // calcBackoffDelay
  // ---------------------------------------------------------------------------
  describe('calcBackoffDelay', () => {
    it('deve respeitar o delay máximo configurado', () => {
      const delay = calcBackoffDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('deve crescer exponencialmente a cada tentativa', () => {
      // Sem jitter (mockamos Math.random para 0)
      jest.spyOn(Math, 'random').mockReturnValue(0);
      const d0 = calcBackoffDelay(0, 1000, 60000);
      const d1 = calcBackoffDelay(1, 1000, 60000);
      const d2 = calcBackoffDelay(2, 1000, 60000);
      expect(d1).toBeGreaterThan(d0);
      expect(d2).toBeGreaterThan(d1);
    });

    it('deve ter valor mínimo maior ou igual a zero', () => {
      const delay = calcBackoffDelay(0, 100, 30000);
      expect(delay).toBeGreaterThanOrEqual(0);
    });
  });
});
