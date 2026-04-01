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
  })
  @ApiResponse({
    status: 201,
    description: 'Sincronização concluída com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 429, description: 'Muitas requisições' })
  async sync(@Body() syncDto: SyncDto) {
    return this.energyService.syncData(syncDto);
  }
}
