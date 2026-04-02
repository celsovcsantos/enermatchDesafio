import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnergyService } from '../energy.service';
import { SyncDto } from './sync.dto';
import { StaticJwtGuard } from '../../common/guards/static-jwt.guard';

@ApiTags('Sincronização')
@ApiBearerAuth()
@Controller('energy/sync')
@UseGuards(StaticJwtGuard)
export class SyncController {
  constructor(private readonly energyService: EnergyService) {}

  @Post()
  @ApiOperation({
    summary: 'Dispara a sincronização manual de dados com a EIA',
    description:
      'Aciona a busca e persistência de dados de consumo de energia junto à API da EIA. ' +
      'Em caso de falha transitória (timeout, 5xx), a integração realiza retentativas automáticas com backoff exponencial ' +
      'conforme configurado por EIA_MAX_RETRIES.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sincronização concluída com sucesso',
    schema: {
      example: { count: 42, message: 'Sincronização concluída com sucesso' },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado — token ausente ou inválido' })
  @ApiResponse({ status: 422, description: 'Falha ao processar os dados retornados pela EIA (SYNC_ERROR)' })
  @ApiResponse({
    status: 429,
    description: 'Muitas requisições — rate limit local atingido (THROTTLE_LIMIT) ' + 'ou rate limit da API EIA (EIA_RATE_LIMIT)',
  })
  @ApiResponse({
    status: 502,
    description:
      'Erro de integração com a EIA — pode indicar credencial inválida (EIA_AUTH_ERROR), ' +
      'resposta inesperada (EIA_INVALID_RESPONSE) ou falha genérica (EIA_INTEGRATION_ERROR)',
  })
  @ApiResponse({
    status: 503,
    description: 'Serviço da EIA temporariamente indisponível após todas as retentativas (EIA_SERVICE_UNAVAILABLE)',
  })
  @ApiResponse({
    status: 504,
    description: 'Timeout ao contatar a API EIA após todas as retentativas (EIA_TIMEOUT)',
  })
  async sync(@Body() syncDto: SyncDto) {
    return this.energyService.syncData(syncDto);
  }
}
