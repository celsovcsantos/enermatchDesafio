import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { StaticJwtGuard } from '../common/guards/static-jwt.guard';
import { ConfigService } from '@nestjs/config';

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        ReportsService,
        {
          provide: ReportsService,
          useValue: {
            getTotalConsumption: jest.fn(),
            getAverageConsumption: jest.fn(),
            getPeakConsumption: jest.fn(),
            getConsumptionByRegion: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        StaticJwtGuard,
      ],
    })
      .overrideGuard(StaticJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTotal', () => {
    it('deve retornar consumo total', async () => {
      const filters: ReportFilterDto = {
        start: '2024-01-01',
        end: '2024-01-31',
      };
      const mockResult = { total: '50000', unit: 'megawatthours' };

      (reportsService.getTotalConsumption as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getTotal(filters);

      expect(reportsService.getTotalConsumption).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });

    it('deve chamar service sem filtros', async () => {
      const filters: ReportFilterDto = {};
      const mockResult = { total: '100000', unit: 'megawatthours' };

      (reportsService.getTotalConsumption as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getTotal(filters);

      expect(reportsService.getTotalConsumption).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });
  });

  describe('getAverage', () => {
    it('deve retornar média de consumo', async () => {
      const filters: ReportFilterDto = {
        start: '2024-01-01',
        end: '2024-01-31',
      };
      const mockResult = { average: '1500.5', unit: 'megawatthours' };

      (reportsService.getAverageConsumption as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getAverage(filters);

      expect(reportsService.getAverageConsumption).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });

    it('deve retornar undefined quando não há dados', async () => {
      const filters: ReportFilterDto = {};

      (reportsService.getAverageConsumption as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.getAverage(filters);

      expect(result).toBeUndefined();
    });
  });

  describe('getPeak', () => {
    it('deve retornar pico de consumo', async () => {
      const filters: ReportFilterDto = { region: 'PJM' };
      const mockResult = {
        peak: '10000',
        period: '2024-01-15T12',
        region: 'PJM',
        unit: 'megawatthours',
      };

      (reportsService.getPeakConsumption as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getPeak(filters);

      expect(reportsService.getPeakConsumption).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getByRegion', () => {
    it('deve retornar consumo por região', async () => {
      const filters: ReportFilterDto = {
        start: '2024-01-01',
        end: '2024-01-31',
      };
      const mockResult = [
        {
          region: 'PJM',
          regionName: 'PJM Interconnection',
          total: '30000',
          unit: 'megawatthours',
        },
        {
          region: 'MISO',
          regionName: 'Midcontinent ISO',
          total: '20000',
          unit: 'megawatthours',
        },
      ];

      (reportsService.getConsumptionByRegion as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getByRegion(filters);

      expect(reportsService.getConsumptionByRegion).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });

    it('deve retornar array vazio quando não há dados', async () => {
      const filters: ReportFilterDto = {};

      (reportsService.getConsumptionByRegion as jest.Mock).mockResolvedValue([]);

      const result = await controller.getByRegion(filters);

      expect(result).toEqual([]);
    });

    it('deve passar filtro de região para service', async () => {
      const filters: ReportFilterDto = { region: 'PJM' };
      const mockResult = [
        {
          region: 'PJM',
          regionName: 'PJM Interconnection',
          total: '30000',
          unit: 'megawatthours',
        },
      ];

      (reportsService.getConsumptionByRegion as jest.Mock).mockResolvedValue(mockResult);

      await controller.getByRegion(filters);

      expect(reportsService.getConsumptionByRegion).toHaveBeenCalledWith(filters);
    });
  });
});
