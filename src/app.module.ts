import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { Env } from './config/env.schema';
import { SyncModule } from './energy/sync/sync.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    SyncModule,
    ReportsModule,
    // LoggerModule.forRoot({
    //   pinoHttp: {
    //     transport:
    //       process.env.NODE_ENV !== 'production'
    //         ? { target: 'pino-pretty' }
    //         : undefined,
    //   },
    // }),
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'enermatchAPI',
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        //customProps: (req, res) => ({ context: 'HTTP' }),
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            level: ['info', 'error', 'debug ', 'warn', 'fatal'],
            minimumLevel: 0,
            colorize: process.env.NODE_ENV === 'production' ? false : true,
            //levelFirst: false,
            translateTime: `yyyy-mm-dd HH:MM:ss.l Z`, //`SYS:yyyy-mm-dd HH:MM:ss.l Z`, //"yyyy-mm-dd'T'HH:MM:ss.l'Z'",
            // messageFormat:
            //   '{req.headers.x-correlation-id} [{context}] {msg}',
            ignore: 'pid,hostname', //,context,req,res,responseTime',
            //errorLikeObjectKeys: ['err', 'error'],
          },
        },
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL') ?? 60,
            limit: configService.get<number>('THROTTLE_LIMIT') ?? 30,
          },
        ],
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
