import { Injectable, Logger } from '@nestjs/common';
import { EiaHttpClient } from '../eia/eia-http.client';
import { EnergyRepository } from './energy.repository';
import { SyncException } from '../common/exceptions/app.exception';

@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);

  constructor(
    private readonly eiaHttpClient: EiaHttpClient,
    private readonly energyRepository: EnergyRepository,
  ) {}

  async syncData(params: { start?: string; end?: string }) {
    this.logger.log(`Iniciando sincronização de dados: ${JSON.stringify(params)}`);

    try {
      const eiaData = await this.eiaHttpClient.getRegionData(params);

      if (!eiaData.response.data || eiaData.response.data.length === 0) {
        this.logger.warn('Nenhum dado retornado pela API EIA para o período informado.');
        return { count: 0, message: 'Nenhum dado encontrado' };
      }

      await this.energyRepository.upsertRecords(eiaData.response.data);

      this.logger.log(`Sincronização concluída com sucesso. ${eiaData.response.data.length} registros processados.`);

      return {
        count: eiaData.response.data.length,
        message: 'Sincronização concluída com sucesso',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro durante a sincronização: ${message}`);
      throw new SyncException(`Falha ao sincronizar dados: ${message}`);
    }
  }
}
