import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { EiaHttpClient, EiaResponse } from './eia-http.client';
import { EiaIntegrationException } from '../common/exceptions/app.exception';

describe('EiaHttpClient', () => {
  let client: EiaHttpClient;
  let httpService: HttpService;

  const mockResponse: EiaResponse = {
    response: {
      total: 1,
      count: 1,
      offset: 0,
      data: [
        {
          period: '2024-01-01T00',
          respondent: 'PJM',
          respondentName: 'PJM Interconnection',
          type: 'D',
          typeDescription: 'Demand',
          value: 1000,
          unit: 'megawatthours',
        },
      ],
    },
  };

  const createMockConfig = (): InternalAxiosRequestConfig =>
    ({
      headers: {},
    }) as InternalAxiosRequestConfig;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EiaHttpClient,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string): string | undefined => {
              const config: Record<string, string> = {
                EIA_API_KEY: 'test-api-key',
                EIA_BASE_URL: 'https://api.eia.gov/v2',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    client = module.get<EiaHttpClient>(EiaHttpClient);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRegionData', () => {
    it('deve retornar dados da API EIA com sucesso', async () => {
      const mockAxiosResponse: AxiosResponse<EiaResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: createMockConfig(),
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockAxiosResponse));

      const result = await client.getRegionData({
        start: '2024-01-01T00',
        end: '2024-01-31T23',
      });

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.eia.gov/v2/electricity/rto/region-data/data',
        expect.objectContaining({
          params: expect.any(Object) as object,
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('deve usar valores padrão para offset e length', async () => {
      const mockAxiosResponse: AxiosResponse<EiaResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: createMockConfig(),
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockAxiosResponse));

      await client.getRegionData({});

      expect(httpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.any(Object) as object,
        }),
      );
    });

    it('deve usar valores customizados para offset e length', async () => {
      const mockAxiosResponse: AxiosResponse<EiaResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: createMockConfig(),
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockAxiosResponse));

      await client.getRegionData({ offset: 100, length: 1000 });

      expect(httpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.any(Object) as object,
        }),
      );
    });

    it('deve lançar EiaIntegrationException em caso de erro de rede', async () => {
      const networkError = new Error('Network error');
      (httpService.get as jest.Mock).mockReturnValue(throwError(() => networkError));

      await expect(client.getRegionData({})).rejects.toThrow(EiaIntegrationException);
      await expect(client.getRegionData({})).rejects.toThrow('Network error');
    });

    it('deve lançar EiaIntegrationException em caso de erro Axios', async () => {
      const axiosError = new AxiosError<Record<string, unknown>>(
        'Request failed',
        'REQUEST_FAILED',
        createMockConfig(),
        {},
        {
          data: { message: 'API Error Details' },
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: createMockConfig(),
        },
      );

      (httpService.get as jest.Mock).mockReturnValue(throwError(() => axiosError));

      await expect(client.getRegionData({})).rejects.toThrow(EiaIntegrationException);
    });

    it('deve passarfacets de type corretamente', async () => {
      const mockAxiosResponse: AxiosResponse<EiaResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: createMockConfig(),
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockAxiosResponse));

      await client.getRegionData({});

      expect(httpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.any(Object) as object,
        }),
      );
    });
  });
});
