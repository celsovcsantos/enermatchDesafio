import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { EnergyService } from '../energy.service';
import { SyncDto } from './sync.dto';
import { StaticJwtGuard } from '../../common/guards/static-jwt.guard';
import { ConfigService } from '@nestjs/config';

describe('SyncController', () => {
  let controller: SyncController;
  let energyService: EnergyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        EnergyService,
        {
          provide: EnergyService,
          useValue: {
            syncData: jest.fn(),
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

    controller = module.get<SyncController>(SyncController);
    energyService = module.get<EnergyService>(EnergyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sync', () => {
    it('deve chamar syncData com parâmetros fornecidos', async () => {
      const syncDto: SyncDto = {
        start: '2024-01-01T00',
        end: '2024-01-31T23',
      };

      const mockResult = {
        count: 100,
        message: 'Sincronização concluída com sucesso',
      };
      (energyService.syncData as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.sync(syncDto);

      expect(energyService.syncData.bind(energyService)).toHaveBeenCalledWith(syncDto);
      expect(result).toEqual(mockResult);
    });

    it('deve chamar syncData com objeto vazio quando nenhum parâmetro é fornecido', async () => {
      const syncDto: SyncDto = {};

      const mockResult = { count: 0, message: 'Nenhum dado encontrado' };
      (energyService.syncData as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.sync(syncDto);

      expect(energyService.syncData.bind(energyService)).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });

    it('deve propagar erro quando syncData falha', async () => {
      const syncDto: SyncDto = {};

      const error = new Error('Sync failed');
      (energyService.syncData as jest.Mock).mockRejectedValue(error);

      await expect(controller.sync(syncDto)).rejects.toThrow(error);
    });

    it('deve retornar resultado com count correto', async () => {
      const syncDto: SyncDto = {
        start: '2024-01-01T00',
      };

      const mockResult = {
        count: 5000,
        message: 'Sincronização concluída com sucesso',
      };
      (energyService.syncData as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.sync(syncDto);

      expect(result.count).toBe(5000);
      expect(result.message).toBe('Sincronização concluída com sucesso');
    });
  });
});
