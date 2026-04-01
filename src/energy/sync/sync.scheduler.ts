import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnergyService } from '../energy.service';

@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(private readonly energyService: EnergyService) {}

  @Cron(process.env.SYNC_CRON_EXPRESSION || CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Iniciando coleta automática de dados (Cron)');
    try {
      await this.energyService.syncData({});
      this.logger.log('Coleta automática concluída com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Falha na coleta automática: ${message}`);
    }
  }
}
