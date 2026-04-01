import { Injectable, Logger } from '@nestjs/common';
import { EiaHttpClient, EiaResponse } from '../eia/eia-http.client';
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

      //console.log('Dados brutos da EIA:', JSON.stringify(eiaData.response.data, null, 2));

      const records = this.mapEiaDataToEntities(eiaData.response.data);
      await this.energyRepository.upsertRecords(records);

      this.logger.log(`Sincronização concluída com sucesso. ${records.length} registros processados.`);

      return {
        count: records.length,
        message: 'Sincronização concluída com sucesso',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro durante a sincronização: ${message}`);
      throw new SyncException(`Falha ao sincronizar dados: ${message}`);
    }
  }

  private mapEiaDataToEntities(data: EiaResponse['response']['data']): Partial<EnergyRecord>[] {
    const records: Partial<EnergyRecord>[] = [];

    for (const item of data) {
      const record = this.mapEiaRecordToEntity(item);
      if (record) {
        records.push(record);
      }
    }

    return records;
  }

  private mapEiaRecordToEntity(item: EiaDataRecord): Partial<EnergyRecord> | null {
    // Validação: campos obrigatórios não podem ser null/undefined
    if (!item.period || !item.respondent || !item.type) {
      this.logger.warn(`Registro ignorado por campos obrigatórios ausentes: ${JSON.stringify(item)}`);
      return null;
    }

    // Se respondent-name estiver ausente, usar respondent como fallback
    const respondentName = item['respondent-name'] || item.respondent;
    const typeDescription = item['type-name'] || item.type;
    const unit = item['value-units'] || 'unknown';
    const value = item.value ? parseFloat(item.value) : 0;

    // Ignorar registros com valor inválido (NaN)
    if (isNaN(value)) {
      this.logger.warn(`Registro ignorado por valor inválido: ${JSON.stringify(item)}`);
      return null;
    }

    return {
      period: item.period,
      respondent: item.respondent,
      respondentName: respondentName,
      type: item.type,
      typeDescription: typeDescription,
      value: value,
      unit: unit,
    };
  }
}
