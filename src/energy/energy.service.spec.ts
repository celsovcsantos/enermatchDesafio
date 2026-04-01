import { Test, TestingModule } from '@nestjs/testing';
import { EnergyService } from './energy.service';
import { EiaHttpClient } from '../eia/eia-http.client';
import { EnergyRepository } from './energy.repository';
import { SyncException } from '../common/exceptions/app.exception';
import { EnergyRecord } from './energy.entity';

interface EiaDataRecord {
  period: string;
  respondent: string;
  'respondent-name': string;
  type: string;
  'type-name': string;
  value: string;
  'value-units': string;
}

interface MockEiaData {
  response: {
    data: EiaDataRecord[] | undefined;
  };
}

type UpsertRecordsMock = jest.Mock<Promise<void>, [Partial<EnergyRecord>[]]>;

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
              'respondent-name': 'PJM Interconnection',
              type: 'D',
              'type-name': 'Demand',
              value: '1000',
              'value-units': 'megawatthours',
            },
          ],
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);
      (energyRepository.upsertRecords as UpsertRecordsMock).mockResolvedValue(undefined);

      const result = await service.syncData({});

      expect(result.count).toBe(1);
      expect(result.message).toBe('Sincronização concluída com sucesso');
      expect(eiaHttpClient.getRegionData).toHaveBeenCalledWith({});
      expect(energyRepository.upsertRecords).toHaveBeenCalledTimes(1);

      const calledRecords = (energyRepository.upsertRecords as UpsertRecordsMock).mock.calls[0]?.[0];
      expect(calledRecords).toHaveLength(1);
      expect(calledRecords?.[0].period).toBe('2024-01-01T00');
      expect(calledRecords?.[0].respondent).toBe('PJM');
      expect(calledRecords?.[0].respondentName).toBe('PJM Interconnection');
      expect(calledRecords?.[0].type).toBe('D');
      expect(calledRecords?.[0].typeDescription).toBe('Demand');
      expect(calledRecords?.[0].value).toBe(1000);
      expect(calledRecords?.[0].unit).toBe('megawatthours');
    });

    it('deve sincronizar múltiplos registros', async () => {
      const mockEiaData: MockEiaData = {
        response: {
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
            {
              period: '2024-01-01T01',
              respondent: 'PJM',
              'respondent-name': 'PJM Interconnection',
              type: 'D',
              'type-name': 'Demand',
              value: '1100',
              'value-units': 'megawatthours',
            },
            {
              period: '2024-01-01T02',
              respondent: 'MISO',
              'respondent-name': 'MISO',
              type: 'D',
              'type-name': 'Demand',
              value: '900',
              'value-units': 'megawatthours',
            },
          ],
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);
      (energyRepository.upsertRecords as UpsertRecordsMock).mockResolvedValue(undefined);

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
              'respondent-name': 'PJM Interconnection',
              type: 'D',
              'type-name': 'Demand',
              value: '1000',
              'value-units': 'megawatthours',
            },
          ],
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);
      (energyRepository.upsertRecords as UpsertRecordsMock).mockRejectedValue(new Error('Database error'));

      await expect(service.syncData({})).rejects.toThrow(SyncException);
    });

    it('deve lançar SyncException com mensagem correta para erros desconhecidos', async () => {
      (eiaHttpClient.getRegionData as jest.Mock).mockRejectedValue(new Error('Unknown error'));

      await expect(service.syncData({})).rejects.toThrow(SyncException);
      await expect(service.syncData({})).rejects.toThrow('Falha ao sincronizar dados: Unknown error');
    });

    it('deve usar respondent como fallback para respondentName quando ausente', async () => {
      const mockEiaData: MockEiaData = {
        response: {
          data: [
            {
              period: '2024-01-01T00',
              respondent: 'PJM',
              'respondent-name': '', // Ausente ou vazio
              type: 'D',
              'type-name': 'Demand',
              value: '1000',
              'value-units': 'megawatthours',
            },
          ],
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);
      (energyRepository.upsertRecords as UpsertRecordsMock).mockResolvedValue(undefined);

      await service.syncData({});

      const calledRecords = (energyRepository.upsertRecords as UpsertRecordsMock).mock.calls[0]?.[0];
      expect(calledRecords?.[0]?.respondentName).toBe('PJM'); // Fallback para respondent
    });

    it('deve usar respondent como fallback para respondentName quando undefined', async () => {
      const mockEiaData: MockEiaData = {
        response: {
          data: [
            {
              period: '2024-01-01T00',
              respondent: 'MISO',
              'respondent-name': '' as unknown as string, // undefined ou vazio
              type: 'D',
              'type-name': 'Demand',
              value: '1000',
              'value-units': 'megawatthours',
            },
          ],
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);
      (energyRepository.upsertRecords as UpsertRecordsMock).mockResolvedValue(undefined);

      await service.syncData({});

      const calledRecords = (energyRepository.upsertRecords as UpsertRecordsMock).mock.calls[0]?.[0];
      expect(calledRecords?.[0]?.respondentName).toBe('MISO'); // Fallback para respondent
    });

    it('deve ignorar registros com campos obrigatórios ausentes', async () => {
      const mockEiaData: MockEiaData = {
        response: {
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
            {
              period: '' as unknown as string, // period ausente
              respondent: 'MISO',
              'respondent-name': 'MISO',
              type: 'D',
              'type-name': 'Demand',
              value: '900',
              'value-units': 'megawatthours',
            },
            {
              period: '2024-01-01T02',
              respondent: '', // respondent vazio
              'respondent-name': 'MISO',
              type: 'D',
              'type-name': 'Demand',
              value: '800',
              'value-units': 'megawatthours',
            },
          ],
        },
      };

      (eiaHttpClient.getRegionData as jest.Mock).mockResolvedValue(mockEiaData);
      (energyRepository.upsertRecords as UpsertRecordsMock).mockResolvedValue(undefined);

      const result = await service.syncData({});

      // Apenas 1 registro válido deve ser processado
      expect(result.count).toBe(1);

      const calledRecords = (energyRepository.upsertRecords as UpsertRecordsMock).mock.calls[0]?.[0];
      expect(calledRecords).toHaveLength(1);
      expect(calledRecords?.[0]?.respondent).toBe('PJM');
    });
  });
});
