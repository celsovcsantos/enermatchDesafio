import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { EnergyRepository } from '../energy/energy.repository';

describe('ReportsService', () => {
  let service: ReportsService;
  let energyRepository: EnergyRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: EnergyRepository,
          useValue: {
            getTotalConsumption: jest.fn(),
            getAverageConsumption: jest.fn(),
            getPeakConsumption: jest.fn(),
            getConsumptionByRegion: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    energyRepository = module.get<EnergyRepository>(EnergyRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTotalConsumption', () => {
    it('deve retornar o consumo total', async () => {
      const mockResult = { total: '50000', unit: 'megawatthours' };
      (energyRepository.getTotalConsumption as jest.Mock).mockResolvedValue(mockResult);

      const filters = { start: '2024-01-01', end: '2024-01-31', region: 'PJM' };
      const result = await service.getTotalConsumption(filters);

      expect(energyRepository.getTotalConsumption.bind(energyRepository)).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });

    it('deve chamar repository mesmo sem filtros', async () => {
      const mockResult = { total: '100000', unit: 'megawatthours' };
      (energyRepository.getTotalConsumption as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.getTotalConsumption({});

      expect(energyRepository.getTotalConsumption.bind(energyRepository)).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });

    it('deve propagar erro do repository', async () => {
      (energyRepository.getTotalConsumption as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.getTotalConsumption({})).rejects.toThrow('Database error');
    });
  });

  describe('getAverageConsumption', () => {
    it('deve retornar a média de consumo', async () => {
      const mockResult = { average: '1500.5', unit: 'megawatthours' };
      (energyRepository.getAverageConsumption as jest.Mock).mockResolvedValue(mockResult);

      const filters = { start: '2024-01-01', end: '2024-01-31' };
      const result = await service.getAverageConsumption(filters);

      expect(energyRepository.getAverageConsumption.bind(energyRepository)).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });

    it('deve retornar undefined quando não há dados', async () => {
      (energyRepository.getAverageConsumption as jest.Mock).mockResolvedValue(undefined);

      const result = await service.getAverageConsumption({});

      expect(result).toBeUndefined();
    });
  });

  describe('getPeakConsumption', () => {
    it('deve retornar o pico de consumo', async () => {
      const mockResult = {
        peak: '10000',
        period: '2024-01-15T12',
        region: 'PJM',
        unit: 'megawatthours',
      };
      (energyRepository.getPeakConsumption as jest.Mock).mockResolvedValue(mockResult);

      const filters = { start: '2024-01-01', end: '2024-01-31' };
      const result = await service.getPeakConsumption(filters);

      expect(energyRepository.getPeakConsumption.bind(energyRepository)).toHaveBeenCalledWith(filters);
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
      (energyRepository.getConsumptionByRegion as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.getConsumptionByRegion({});

      expect(energyRepository.getConsumptionByRegion.bind(energyRepository)).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });

    it('deve retornar array vazio quando não há dados', async () => {
      (energyRepository.getConsumptionByRegion as jest.Mock).mockResolvedValue([]);

      const result = await service.getConsumptionByRegion({});

      expect(result).toEqual([]);
    });

    it('deve passar filtro de região para repository', async () => {
      const mockResult = [
        {
          region: 'PJM',
          regionName: 'PJM Interconnection',
          total: '30000',
          unit: 'megawatthours',
        },
      ];
      (energyRepository.getConsumptionByRegion as jest.Mock).mockResolvedValue(mockResult);

      const filters = { region: 'PJM' };
      await service.getConsumptionByRegion(filters);

      expect(energyRepository.getConsumptionByRegion.bind(energyRepository)).toHaveBeenCalledWith(filters);
    });
  });
});
