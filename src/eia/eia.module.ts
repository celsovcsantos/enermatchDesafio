import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EiaHttpClient } from './eia-http.client';
import { Env } from '../config/env.schema';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => ({
        timeout: configService.get<number>('EIA_TIMEOUT_MS'),
        maxRedirects: 5,
      }),
    }),
  ],
  providers: [EiaHttpClient],
  exports: [EiaHttpClient],
})
export class EiaModule {}
