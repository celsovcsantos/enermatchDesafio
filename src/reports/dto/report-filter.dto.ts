import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReportFilterDto {
  @ApiPropertyOptional({
    description: 'Data de início no formato YYYY-MM-DDTHH',
    example: '2024-01-01T00',
  })
  @IsOptional()
  @IsString()
  start?: string;

  @ApiPropertyOptional({
    description: 'Data de fim no formato YYYY-MM-DDTHH',
    example: '2024-01-01T23',
  })
  @IsOptional()
  @IsString()
  end?: string;

  @ApiPropertyOptional({
    description: 'Código da região (respondent)',
    example: 'PJM',
  })
  @IsOptional()
  @IsString()
  region?: string;
}
