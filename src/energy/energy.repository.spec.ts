import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { EnergyRepository } from './energy.repository';
import { EnergyRecord } from './energy.entity';

describe('EnergyRepository', () => {
  let repository: EnergyRepository;
  let mockQueryBuilder: {
    insert: jest.Mock;
    into: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    andWhere: jest.Mock;
    groupBy: jest.Mock;
    addGroupBy: jest.Mock;
    orderBy: jest.Mock;
    getRawOne: jest.Mock;
    getRawMany: jest.Mock;
  };
  let mockInsertBuilder: {
    into: jest.Mock;
    values: jest.Mock;
    orUpdate: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(async () => {
    mockInsertBuilder = {
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orUpdate: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    };

    mockQueryBuilder = {
      insert: jest.fn().mockReturnValue(mockInsertBuilder),
      into: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
    };

    // Create repository with mocked createQueryBuilder
    const mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnergyRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<EnergyRepository>(EnergyRepository);

    // Override createQueryBuilder to use our mock
    (repository as unknown as { createQueryBuilder: jest.Mock }).createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertRecords', () => {
    it('deve chamar insert com valores corretos', async () => {
      const records = [
        {
          period: '2024-01-01T00',
          respondent: 'PJM',
          respondentName: 'PJM Interconnection',
          type: 'D',
          typeDescription: 'Demand',
          value: 1000,
          unit: 'megawatthours',
        } as Partial<EnergyRecord>,
      ];

      await repository.upsertRecords(records);

      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(mockInsertBuilder.into).toHaveBeenCalledWith(EnergyRecord);
      expect(mockInsertBuilder.values).toHaveBeenCalledWith(records);
      expect(mockInsertBuilder.orUpdate).toHaveBeenCalledWith(
        ['respondentName', 'typeDescription', 'value', 'unit', 'updatedAt'],
        ['period', 'respondent', 'type'],
      );
      expect(mockInsertBuilder.execute).toHaveBeenCalled();
    });

    it('não deve executar query quando records está vazio', async () => {
      await repository.upsertRecords([]);

      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
      expect(mockInsertBuilder.execute).not.toHaveBeenCalled();
    });

    it('deve processar registros em chunks de 1000 quando exceder limite', async () => {
      const CHUNK_SIZE = 1000;
      const totalRecords = 2500;
      const records = Array.from({ length: totalRecords }, (_, i) => ({
        period: `2024-01-${String((i % 31) + 1).padStart(2, '0')}`,
        respondent: `RTO${i}`,
        respondentName: `RTO Name ${i}`,
        type: 'D',
        typeDescription: 'Demand',
        value: i,
        unit: 'megawatthours',
      })) as Partial<EnergyRecord>[];

      await repository.upsertRecords(records);

      // Deve chamar execute 3 vezes (1000 + 1000 + 500)
      expect(mockInsertBuilder.execute).toHaveBeenCalledTimes(3);

      // Verifica que cada chunk foi processado com os valores corretos
      expect(mockInsertBuilder.values).toHaveBeenNthCalledWith(1, records.slice(0, CHUNK_SIZE));
      expect(mockInsertBuilder.values).toHaveBeenNthCalledWith(2, records.slice(CHUNK_SIZE, CHUNK_SIZE * 2));
      expect(mockInsertBuilder.values).toHaveBeenNthCalledWith(3, records.slice(CHUNK_SIZE * 2));
    });

    it('deve processar exatamente 1000 registros em uma única chamada', async () => {
      const CHUNK_SIZE = 1000;
      const records = Array.from({ length: CHUNK_SIZE }, (_, i) => ({
        period: `2024-01-${String((i % 31) + 1).padStart(2, '0')}`,
        respondent: `RTO${i}`,
        respondentName: `RTO Name ${i}`,
        type: 'D',
        typeDescription: 'Demand',
        value: i,
        unit: 'megawatthours',
      })) as Partial<EnergyRecord>[];

      await repository.upsertRecords(records);

      // Deve chamar execute apenas 1 vez
      expect(mockInsertBuilder.execute).toHaveBeenCalledTimes(1);
      expect(mockInsertBuilder.values).toHaveBeenCalledWith(records);
    });
  });

  describe('applyFilters', () => {
    it('deve aplicar filtro de start quando fornecido', async () => {
      const filters = { start: '2024-01-01T00' };

      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '50000',
        unit: 'megawatthours',
      });

      await repository.getTotalConsumption(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('record.period >= :start', { start: '2024-01-01T00' });
    });

    it('deve aplicar filtro de end quando fornecido', async () => {
      const filters = { end: '2024-01-31T23' };

      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '50000',
        unit: 'megawatthours',
      });

      await repository.getTotalConsumption(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('record.period <= :end', { end: '2024-01-31T23' });
    });

    it('deve aplicar filtro de region quando fornecido', async () => {
      const filters = { region: 'PJM' };

      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '50000',
        unit: 'megawatthours',
      });

      await repository.getTotalConsumption(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('record.respondent = :region', { region: 'PJM' });
    });

    it('deve aplicar múltiplos filtros simultaneamente', async () => {
      const filters = { start: '2024-01-01', end: '2024-01-31', region: 'PJM' };

      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '50000',
        unit: 'megawatthours',
      });

      await repository.getTotalConsumption(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  describe('getTotalConsumption', () => {
    it('deve retornar total de consumo com select correto', async () => {
      const mockResult = { total: '50000', unit: 'megawatthours' };
      mockQueryBuilder.getRawOne.mockResolvedValue(mockResult);

      const result = await repository.getTotalConsumption({});

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('SUM(record.value)', 'total');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('record.unit', 'unit');
      expect(result).toEqual(mockResult);
    });

    it('deve retornar undefined quando não há dados', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(undefined);

      const result = await repository.getTotalConsumption({});

      expect(result).toBeUndefined();
    });
  });

  describe('getAverageConsumption', () => {
    it('deve retornar média de consumo com select correto', async () => {
      const mockResult = { average: '1500.5', unit: 'megawatthours' };
      mockQueryBuilder.getRawOne.mockResolvedValue(mockResult);

      const result = await repository.getAverageConsumption({});

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('AVG(record.value)', 'average');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPeakConsumption', () => {
    it('deve retornar pico de consumo com selects corretos', async () => {
      const mockResult = {
        peak: '10000',
        period: '2024-01-15T12',
        region: 'PJM',
        unit: 'megawatthours',
      };
      mockQueryBuilder.getRawOne.mockResolvedValue(mockResult);

      const result = await repository.getPeakConsumption({});

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('MAX(record.value)', 'peak');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('peak', 'DESC');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getConsumptionByRegion', () => {
    it('deve retornar consumo agrupado por região', async () => {
      const mockResult = [
        {
          region: 'PJM',
          regionName: 'PJM Interconnection',
          total: '30000',
          unit: 'megawatthours',
        },
        {
          region: 'MISO',
          regionName: 'Midcontinent Independent System Operator',
          total: '20000',
          unit: 'megawatthours',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockResult);

      const result = await repository.getConsumptionByRegion({});

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('record.respondent', 'region');
      expect(result).toEqual(mockResult);
    });

    it('deve retornar array vazio quando não há dados', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await repository.getConsumptionByRegion({});

      expect(result).toEqual([]);
    });
  });
});
