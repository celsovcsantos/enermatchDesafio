import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EnergyService } from '../energy.service';

@Injectable()
export class SyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(SyncScheduler.name);
  private initialSyncDone = false;

  constructor(private readonly energyService: EnergyService) {}

  // Executa uma vez ao iniciar a aplicação
  async onModuleInit() {
    this.logger.log('Executando sincronização inicial...');
    await this.runSync();
    this.initialSyncDone = true;
  }

  // Executa a cada 10 minutos (00, 10, 20, 30, 40, 50 de cada hora)
  @Cron(process.env.SYNC_CRON_EXPRESSION || '0 */10 * * * *')
  async handleCron() {
    // Ignora a primeira execução do cron (já executada no onModuleInit)
    if (!this.initialSyncDone) {
      this.logger.debug('Sincronização inicial já executada, ignorando primeira execução do cron');
      return;
    }
    await this.runSync();
  }

  private async runSync() {
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
