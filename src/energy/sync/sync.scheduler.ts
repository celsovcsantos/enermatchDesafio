import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { EnergyService } from '../energy.service';
import { Env } from '../../config/env.schema';
import { EiaAuthException, EiaInvalidResponseException } from '../../common/exceptions/app.exception';

/**
 * Aguarda o número de milissegundos especificado.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calcula delay com backoff exponencial simples (sem jitter, para o Scheduler
 * onde precisão de tempo importa menos que no HTTP client).
 * Formula: min(baseDelay * 2^attempt, 5 minutos)
 */
export function calcSchedulerBackoff(attempt: number, baseDelayMs: number): number {
  const MAX_DELAY_MS = 5 * 60 * 1000; // 5 minutos
  return Math.min(baseDelayMs * Math.pow(2, attempt), MAX_DELAY_MS);
}

/**
 * Determina se uma exceção justifica nova tentativa pelo Scheduler.
 * Erros de autenticação e resposta inválida não devem ser retentados —
 * eles requerem intervenção humana (corrigir EIA_API_KEY ou investigar o contrato da API).
 */
export function isRetryableByScheduler(error: unknown): boolean {
  if (error instanceof EiaAuthException) return false;
  if (error instanceof EiaInvalidResponseException) return false;
  return true;
}

@Injectable()
export class SyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(SyncScheduler.name);
  private initialSyncDone = false;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(
    private readonly energyService: EnergyService,
    private readonly configService: ConfigService<Env>,
  ) {
    this.maxRetries = this.configService.get<number>('SYNC_MAX_RETRIES') ?? 3;
    this.retryDelayMs = this.configService.get<number>('SYNC_RETRY_DELAY_MS') ?? 5000;
  }

  // Executa uma vez ao iniciar a aplicação
  async onModuleInit() {
    this.logger.log('Executando sincronização inicial...');
    await this.runSyncWithRetry();
    this.initialSyncDone = true;
  }

  // Executa conforme a expressão SYNC_CRON_EXPRESSION (padrão: a cada 10 minutos)
  @Cron(process.env.SYNC_CRON_EXPRESSION || '0 */10 * * * *')
  async handleCron() {
    // Ignora a primeira execução do cron (já executada no onModuleInit)
    if (!this.initialSyncDone) {
      this.logger.debug('Sincronização inicial já executada, ignorando primeira execução do cron');
      return;
    }
    await this.runSyncWithRetry();
  }

  /**
   * Tenta executar a sincronização até (SYNC_MAX_RETRIES + 1) vezes com backoff exponencial.
   * Se todas as tentativas falharem, loga o erro crítico e aguarda o próximo ciclo do cron.
   * Erros não retentáveis (ex: EIA_API_KEY inválida, resposta malformada) encerram
   * imediatamente sem consumir as demais tentativas.
   */
  async runSyncWithRetry() {
    this.logger.log(`Iniciando coleta automática de dados (Cron) — máximo de ${this.maxRetries + 1} tentativa(s)`);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.energyService.syncData({});
        this.logger.log(attempt > 0 ? `Coleta automática concluída com sucesso (após ${attempt + 1} tentativa(s))` : 'Coleta automática concluída com sucesso');
        return;
      } catch (error: unknown) {
        const isLastAttempt = attempt === this.maxRetries;
        const retryable = isRetryableByScheduler(error);
        const message = error instanceof Error ? error.message : 'Erro desconhecido';

        if (!retryable) {
          this.logger.error(`[SyncScheduler] Erro não retentável — abortando ciclo atual. Motivo: ${message}`);
          return;
        }

        if (isLastAttempt) {
          this.logger.error(
            `[SyncScheduler] Todas as ${this.maxRetries + 1} tentativa(s) do ciclo falharam. ` + `Aguardando próximo ciclo do cron. Último erro: ${message}`,
          );
          return;
        }

        const delay = calcSchedulerBackoff(attempt, this.retryDelayMs);
        this.logger.warn(
          `[SyncScheduler] Tentativa ${attempt + 1}/${this.maxRetries + 1} falhou: ${message}. ` + `Aguardando ${delay}ms antes de tentar novamente...`,
        );
        await sleep(delay);
      }
    }
  }
}
