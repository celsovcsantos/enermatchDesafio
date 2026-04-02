import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SyncScheduler, calcSchedulerBackoff, isRetryableByScheduler } from './sync.scheduler';
import { EnergyService } from '../energy.service';
import {
  EiaAuthException,
  EiaInvalidResponseException,
  EiaServiceUnavailableException,
  EiaTimeoutException,
  SyncException,
} from '../../common/exceptions/app.exception';

describe('SyncScheduler', () => {
  let scheduler: SyncScheduler;
  let energyService: EnergyService;

  /**
   * Cria módulo de teste com delay de 1ms para tornar os retries rápidos.
   */
  async function buildModule(maxRetries = 2, retryDelayMs = 1) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncScheduler,
        {
          provide: EnergyService,
          useValue: { syncData: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, number> = {
                SYNC_MAX_RETRIES: maxRetries,
                SYNC_RETRY_DELAY_MS: retryDelayMs,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    return {
      scheduler: module.get<SyncScheduler>(SyncScheduler),
      energyService: module.get<EnergyService>(EnergyService),
    };
  }

  beforeEach(async () => {
    const built = await buildModule();
    scheduler = built.scheduler;
    energyService = built.energyService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // runSyncWithRetry — cenários de sucesso
  // ---------------------------------------------------------------------------
  describe('runSyncWithRetry — sucesso', () => {
    it('deve concluir com sucesso na primeira tentativa', async () => {
      (energyService.syncData as jest.Mock).mockResolvedValue({ count: 10, message: 'ok' });

      await scheduler.runSyncWithRetry();

      expect(energyService.syncData).toHaveBeenCalledTimes(1);
    });

    it('deve concluir com sucesso na segunda tentativa (falha → sucesso)', async () => {
      (energyService.syncData as jest.Mock).mockRejectedValueOnce(new EiaServiceUnavailableException()).mockResolvedValueOnce({ count: 5, message: 'ok' });

      await scheduler.runSyncWithRetry();

      expect(energyService.syncData).toHaveBeenCalledTimes(2);
    });

    it('deve concluir com sucesso na terceira tentativa (2 falhas → sucesso)', async () => {
      (energyService.syncData as jest.Mock)
        .mockRejectedValueOnce(new EiaServiceUnavailableException())
        .mockRejectedValueOnce(new EiaTimeoutException(5000))
        .mockResolvedValueOnce({ count: 3, message: 'ok' });

      await scheduler.runSyncWithRetry();

      expect(energyService.syncData).toHaveBeenCalledTimes(3);
    });
  });

  // ---------------------------------------------------------------------------
  // runSyncWithRetry — esgotamento de tentativas
  // ---------------------------------------------------------------------------
  describe('runSyncWithRetry — esgotamento de tentativas', () => {
    it('deve parar após esgotar todas as tentativas sem lançar exceção', async () => {
      // maxRetries=2: 3 tentativas no total, todas falham
      (energyService.syncData as jest.Mock).mockRejectedValue(new EiaServiceUnavailableException());

      // Não deve propagar exceção — engole o erro e aguarda o próximo cron
      await expect(scheduler.runSyncWithRetry()).resolves.toBeUndefined();
      expect(energyService.syncData).toHaveBeenCalledTimes(3);
    });

    it('deve respeitar SYNC_MAX_RETRIES=0 (apenas 1 tentativa)', async () => {
      const built = await buildModule(0);
      const noRetryScheduler = built.scheduler;
      const noRetryService = built.energyService;

      (noRetryService.syncData as jest.Mock).mockRejectedValue(new EiaServiceUnavailableException());

      await noRetryScheduler.runSyncWithRetry();

      expect(noRetryService.syncData).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // runSyncWithRetry — erros não retentáveis
  // ---------------------------------------------------------------------------
  describe('runSyncWithRetry — erros não retentáveis', () => {
    it('deve abortar imediatamente em EiaAuthException sem retentar', async () => {
      (energyService.syncData as jest.Mock).mockRejectedValue(new EiaAuthException());

      await scheduler.runSyncWithRetry();

      // Deve chamar apenas 1 vez — nenhum retry
      expect(energyService.syncData).toHaveBeenCalledTimes(1);
    });

    it('deve abortar imediatamente em EiaInvalidResponseException sem retentar', async () => {
      (energyService.syncData as jest.Mock).mockRejectedValue(new EiaInvalidResponseException('campo ausente'));

      await scheduler.runSyncWithRetry();

      expect(energyService.syncData).toHaveBeenCalledTimes(1);
    });

    it('deve retentar SyncException genérica (retentável)', async () => {
      (energyService.syncData as jest.Mock).mockRejectedValueOnce(new SyncException('Falha ao sincronizar')).mockResolvedValueOnce({ count: 0, message: 'ok' });

      await scheduler.runSyncWithRetry();

      expect(energyService.syncData).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // handleCron — controle de estado
  // ---------------------------------------------------------------------------
  describe('handleCron', () => {
    it('não deve executar sync se initialSyncDone for false', async () => {
      // initialSyncDone permanece false pois não chamamos onModuleInit
      await scheduler.handleCron();
      expect(energyService.syncData).not.toHaveBeenCalled();
    });

    it('deve executar sync quando initialSyncDone for true', async () => {
      (energyService.syncData as jest.Mock).mockResolvedValue({ count: 1, message: 'ok' });

      // Força initialSyncDone = true e chama handleCron
      (scheduler as unknown as { initialSyncDone: boolean }).initialSyncDone = true;
      await scheduler.handleCron();

      expect(energyService.syncData).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // onModuleInit
  // ---------------------------------------------------------------------------
  describe('onModuleInit', () => {
    it('deve executar runSyncWithRetry e setar initialSyncDone para true', async () => {
      (energyService.syncData as jest.Mock).mockResolvedValue({ count: 5, message: 'ok' });

      await scheduler.onModuleInit();

      expect(energyService.syncData).toHaveBeenCalledTimes(1);
      expect((scheduler as unknown as { initialSyncDone: boolean }).initialSyncDone).toBe(true);
    });

    it('deve setar initialSyncDone para true mesmo quando sync falha em todas as tentativas', async () => {
      (energyService.syncData as jest.Mock).mockRejectedValue(new EiaServiceUnavailableException());

      await scheduler.onModuleInit();

      expect((scheduler as unknown as { initialSyncDone: boolean }).initialSyncDone).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // isRetryableByScheduler (função auxiliar exportada)
  // ---------------------------------------------------------------------------
  describe('isRetryableByScheduler', () => {
    it('deve retornar false para EiaAuthException', () => {
      expect(isRetryableByScheduler(new EiaAuthException())).toBe(false);
    });

    it('deve retornar false para EiaInvalidResponseException', () => {
      expect(isRetryableByScheduler(new EiaInvalidResponseException())).toBe(false);
    });

    it('deve retornar true para EiaServiceUnavailableException', () => {
      expect(isRetryableByScheduler(new EiaServiceUnavailableException())).toBe(true);
    });

    it('deve retornar true para EiaTimeoutException', () => {
      expect(isRetryableByScheduler(new EiaTimeoutException(5000))).toBe(true);
    });

    it('deve retornar true para SyncException genérica', () => {
      expect(isRetryableByScheduler(new SyncException('erro'))).toBe(true);
    });

    it('deve retornar true para erros genéricos (Error)', () => {
      expect(isRetryableByScheduler(new Error('qualquer erro'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // calcSchedulerBackoff (função auxiliar exportada)
  // ---------------------------------------------------------------------------
  describe('calcSchedulerBackoff', () => {
    it('deve crescer exponencialmente a cada tentativa', () => {
      const d0 = calcSchedulerBackoff(0, 1000);
      const d1 = calcSchedulerBackoff(1, 1000);
      const d2 = calcSchedulerBackoff(2, 1000);
      expect(d1).toBeGreaterThan(d0);
      expect(d2).toBeGreaterThan(d1);
    });

    it('deve respeitar o limite máximo de 5 minutos', () => {
      const delay = calcSchedulerBackoff(100, 5000);
      expect(delay).toBeLessThanOrEqual(5 * 60 * 1000);
    });

    it('deve ser exatamente baseDelay na tentativa 0', () => {
      expect(calcSchedulerBackoff(0, 1000)).toBe(1000);
    });

    it('deve ser exatamente 2*baseDelay na tentativa 1', () => {
      expect(calcSchedulerBackoff(1, 1000)).toBe(2000);
    });
  });
});
