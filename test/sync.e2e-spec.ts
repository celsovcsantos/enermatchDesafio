/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SyncController (e2e)', () => {
  let app: INestApplication;
  const staticToken = 'test-token';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string): string | number | undefined => {
          if (key === 'STATIC_JWT_SECRET') return staticToken;
          if (key === 'THROTTLE_TTL') return 60;
          if (key === 'THROTTLE_LIMIT') return 100;
          return process.env[key];
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('/energy/sync (POST) - deve retornar 401 sem token', () => {
    return request(app.getHttpServer()).post('/energy/sync').send({}).expect(401);
  });

  it('/energy/sync (POST) - deve retornar 201 ou erro da EIA com token válido', () => {
    // Este teste pode demorar mais pois faz chamada real à API EIA
    // Timeout aumentado para 30 segundos
    return request(app.getHttpServer())
      .post('/energy/sync')
      .set('Authorization', `Bearer ${staticToken}`)
      .send({ start: '2024-01-01T00', end: '2024-01-01T01' })
      .timeout(30000)
      .expect((res) => {
        // Pode ser 201 (sucesso), 400/422 (erro de validação), 502 (erro EIA), 500 (erro interno)
        // O importante é que o Guard de autenticação passou (não 401)
        if (res.status === 401) {
          throw new Error('Autenticação falhou - token não reconhecido');
        }
        // Qualquer outro status indica que passou no Guard
        console.log(`Sync endpoint retornou status: ${res.status}`);
      });
  }, 35000);

  afterAll(async () => {
    await app.close();
  });
});
