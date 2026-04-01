import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { StaticJwtGuard } from '../common/guards/static-jwt.guard';

@ApiTags('Relatórios')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(StaticJwtGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('total')
  @ApiOperation({ summary: 'Obtém o consumo total no período' })
  @ApiResponse({ status: 200, description: 'Sucesso' })
  async getTotal(@Query() filters: ReportFilterDto) {
    return this.reportsService.getTotalConsumption(filters);
  }

  @Get('average')
  @ApiOperation({ summary: 'Obtém a média de consumo no período' })
  @ApiResponse({ status: 200, description: 'Sucesso' })
  async getAverage(@Query() filters: ReportFilterDto) {
    return this.reportsService.getAverageConsumption(filters);
  }

  @Get('peak')
  @ApiOperation({ summary: 'Obtém o pico de consumo no período' })
  @ApiResponse({ status: 200, description: 'Sucesso' })
  async getPeak(@Query() filters: ReportFilterDto) {
    return this.reportsService.getPeakConsumption(filters);
  }

  @Get('by-region')
  @ApiOperation({ summary: 'Obtém o consumo agrupado por região' })
  @ApiResponse({ status: 200, description: 'Sucesso' })
  async getByRegion(@Query() filters: ReportFilterDto) {
    return this.reportsService.getConsumptionByRegion(filters);
  }
}
