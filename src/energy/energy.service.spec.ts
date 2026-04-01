import { Test, TestingModule } from '@nestjs/testing';
import { EnergyService } from './energy.service';
import { EiaHttpClient } from '../eia/eia-http.client';
import { EnergyRepository } from './energy.repository';
import { SyncException } from '../common/exceptions/app.exception';

interface EiaDataRecord {
  period: string;
  respondent: string;
  respondentName: string;
  type: string;
  typeDescription: string;
  value: number;
  unit: string;
}

interface MockEiaData {
  response: {
    data: EiaDataRecord[] | undefined;
  };
}

describe('EnergyService', () => {
  let service: EnergyService;
  let eiaHttpClient: EiaHttpClient;
  let energyRepository: EnergyRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnergyService,
        {
          provide: EiaHttpClient,
          useValue: {
            getRegionData: jest.fn(),
          },
        },
        {
          provide: EnergyRepository,
          useValue: {
            upsertRecords: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EnergyService>(EnergyService);
    eiaHttpClient = module.get<EiaHttpClient>(EiaHttpClient);
    energyRepository = module.get<EnergyRepository>(EnergyRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncData', () => {
    it('deve sincronizar dados com sucesso', async () => {
      const mockEiaData: MockEiaData = {
        response: {
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

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);
      (energyRepository.upsertRecords as jest.Mock).mockResolvedValue(undefined);

      const result = await service.syncData({});

      expect(result.count).toBe(1);
      expect(result.message).toBe('Sincronização concluída com sucesso');
      expect(eiaHttpClient.getRegionData).toHaveBeenCalledWith({});
      expect(energyRepository.upsertRecords).toHaveBeenCalledWith(mockEiaData.response.data);
    });

    it('deve sincronizar múltiplos registros', async () => {
      const mockEiaData: MockEiaData = {
        response: {
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
            {
              period: '2024-01-01T01',
              respondent: 'PJM',
              respondentName: 'PJM Interconnection',
              type: 'D',
              typeDescription: 'Demand',
              value: 1100,
              unit: 'megawatthours',
            },
            {
              period: '2024-01-01T02',
              respondent: 'MISO',
              respondentName: 'MISO',
              type: 'D',
              typeDescription: 'Demand',
              value: 900,
              unit: 'megawatthours',
            },
          ],
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);
      (energyRepository.upsertRecords as jest.Mock).mockResolvedValue(undefined);

      const result = await service.syncData({});

      expect(result.count).toBe(3);
      expect(energyRepository.upsertRecords).toHaveBeenCalledTimes(1);
    });

    it('deve passar parâmetros de data para o cliente EIA', async () => {
      const mockEiaData: MockEiaData = {
        response: {
          data: [],
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);

      const params = { start: '2024-01-01T00', end: '2024-01-31T23' };
      await service.syncData(params);

      expect(eiaHttpClient.getRegionData).toHaveBeenCalledWith(params);
    });

    it('deve retornar mensagem de "nenhum dado encontrado" quando API retorna array vazio', async () => {
      const mockEiaData: MockEiaData = {
        response: {
          data: [],
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);

      const result = await service.syncData({});

      expect(result.count).toBe(0);
      expect(result.message).toBe('Nenhum dado encontrado');
      expect(energyRepository.upsertRecords).not.toHaveBeenCalled();
    });

    it('deve retornar mensagem de "nenhum dado encontrado" quando data é undefined', async () => {
      const mockEiaData: MockEiaData = {
        response: {
          data: undefined,
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);

      const result = await service.syncData({});

      expect(result.count).toBe(0);
      expect(result.message).toBe('Nenhum dado encontrado');
    });

    it('deve lançar SyncException em caso de erro na API EIA', async () => {
      (eiaHttpClient.getRegionData as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(service.syncData({})).rejects.toThrow(SyncException);
      await expect(service.syncData({})).rejects.toThrow('Falha ao sincronizar dados: API Error');
    });

    it('deve lançar SyncException quando upsertRecords falha', async () => {
      const mockEiaData: MockEiaData = {
        response: {
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

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);
      (energyRepository.upsertRecords as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.syncData({})).rejects.toThrow(SyncException);
    });

    it('deve lançar SyncException com mensagem correta para erros desconhecidos', async () => {
      (eiaHttpClient.getRegionData as jest.Mock).mockRejectedValue(new Error('Unknown error'));

      await expect(service.syncData({})).rejects.toThrow(SyncException);
      await expect(service.syncData({})).rejects.toThrow('Falha ao sincronizar dados: Unknown error');
    });
  });
});
